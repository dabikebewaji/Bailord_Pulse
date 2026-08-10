import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getDashboardStats = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get total retailers count and growth
    // COALESCE matters here: SUM() over zero matching rows returns NULL, not 0
    // (COUNT(*) does return 0) — without it, an empty/near-empty table made
    // these fields null and crashed the dashboard on the frontend's .toString().
    const [retailerStats] = await conn.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN joined_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as new_last_30_days,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_count
      FROM retailers
    `);

    // Get active projects count and completion rate
    const [projectStats] = await conn.query(
      "SELECT COUNT(*) as total, " +
      "COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed, " +
      "COALESCE(SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END), 0) as ongoing, " +
      "COALESCE(SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END), 0) as delayed_count, " +
      "COALESCE(AVG(progress), 0) as avg_progress " +
      "FROM projects"
    );

    // Get performance metrics
    const [performanceStats] = await conn.query(`
      SELECT
        COALESCE(AVG(total_orders), 0) as avg_orders,
        COALESCE(AVG(total_sales), 0) as avg_sales,
        COALESCE(AVG(average_rating), 0) as avg_rating
      FROM retailers
      WHERE status = 'active'
    `);

    // Jan–Dec of the current calendar year (not a rolling window) — as the
    // year progresses, real months fill in and the chart grows continuously
    // instead of a 6-month window sliding past older data.
    const MONTHS_OF_YEAR = `
      SELECT DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-01-01'), INTERVAL m MONTH) as date_month
      FROM (
        SELECT 0 as m UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
        UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
        UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
      ) months
    `;

    // Monthly active retailers for the current year (Jan–Dec)
    const [monthlyRetailers] = await conn.query(`
      SELECT
        DATE_FORMAT(date_month, '%b') as month,
        active_count,
        new_registrations
      FROM (
        SELECT
          date_month,
          (
            SELECT COUNT(*)
            FROM retailers
            WHERE status = 'active'
            AND joined_date <= LAST_DAY(date_month)
          ) as active_count,
          (
            SELECT COUNT(*)
            FROM retailers
            WHERE joined_date BETWEEN date_month AND LAST_DAY(date_month)
          ) as new_registrations
        FROM (${MONTHS_OF_YEAR}) months
      ) monthly_data
      ORDER BY date_month;
    `);

    // Real monthly revenue from the orders table (cancelled orders excluded)
    // — replaces an earlier synthetic formula that multiplied retailers'
    // stale total_sales column by an arbitrary growth factor and never
    // reflected actual order activity.
    const [monthlyRevenue] = await conn.query(`
      SELECT
        DATE_FORMAT(date_month, '%b') as month,
        (
          SELECT COALESCE(SUM(o.total_amount), 0)
          FROM orders o
          WHERE o.status != 'cancelled'
            AND DATE_FORMAT(o.created_at, '%Y-%m') = DATE_FORMAT(date_month, '%Y-%m')
        ) as revenue
      FROM (${MONTHS_OF_YEAR}) monthly_data
      ORDER BY date_month;
    `);

    // Calculate month-over-month growth for retailers. monthlyRetailers is
    // ordered Jan→Dec (ascending), so the current month's index is just
    // today's 0-based month number — not a fixed [0]/[1] pair, which only
    // worked under the old "most-recent-first" ordering.
    const currentMonthIndex = new Date().getMonth();
    const currentMonthActive = monthlyRetailers[currentMonthIndex]?.active_count || 0;
    const previousMonthActive = monthlyRetailers[currentMonthIndex - 1]?.active_count || 0;
    const retailerGrowth = previousMonthActive ?
      ((currentMonthActive - previousMonthActive) / previousMonthActive) * 100 : 0;

    // Calculate project completion rate trend
    const completionRate = projectStats[0].total ? 
      (projectStats[0].completed / projectStats[0].total) * 100 : 0;

    // Calculate average performance score
    const performanceScore = Math.round(
      (performanceStats[0].avg_rating * 20) + // Rating contributes 20%
      (projectStats[0].avg_progress || 0) * 0.4 + // Progress contributes 40%
      (performanceStats[0].avg_orders ? Math.min(performanceStats[0].avg_orders / 10 * 40, 40) : 0) // Orders contribute 40%
    );

    // Format the response
    res.json({
      metrics: {
        totalRetailers: {
          value: retailerStats[0].total,
          trend: retailerGrowth,
        },
        activeProjects: {
          value: projectStats[0].ongoing,
          trend: projectStats[0].total
            ? ((projectStats[0].ongoing - projectStats[0].delayed_count) / projectStats[0].total) * 100
            : 0,
        },
        performanceScore: {
          value: performanceScore,
          trend: 5, // Calculate this based on historical data
        },
        activeUsers: {
          value: retailerStats[0].active_count,
          trend: retailerStats[0].total ? (retailerStats[0].active_count / retailerStats[0].total) * 100 : 0,
        }
      },
      charts: {
        retailerPerformance: {
          labels: monthlyRetailers.map(r => r.month),
          datasets: [
            {
              label: 'Active Retailers',
              data: monthlyRetailers.map(r => r.active_count),
            },
            {
              label: 'New Registrations',
              data: monthlyRetailers.map(r => r.new_registrations),
            }
          ]
        },
        projectDistribution: {
          labels: ['Completed', 'Ongoing', 'Delayed'],
          data: [
            projectStats[0].completed,
            projectStats[0].ongoing,
            projectStats[0].delayed_count
          ]
        },
        revenueGrowth: {
          labels: monthlyRevenue.map(r => r.month),
          data: monthlyRevenue.map(r => Number(r.revenue))
        }
      }
    });
  } finally {
    conn.release();
  }
});

export const getRetailerPerformance = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get retailer performance metrics by business type
    const [performanceByType] = await conn.query(`
      SELECT 
        business_type,
        COUNT(*) as count,
        AVG(total_sales) as avg_sales,
        AVG(total_orders) as avg_orders,
        AVG(average_rating) as avg_rating
      FROM retailers
      WHERE status = 'active'
      GROUP BY business_type
    `);

    res.json({
      byBusinessType: performanceByType
    });
  } finally {
    conn.release();
  }
});

export const getProjectStats = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get project completion trends
    const [projectTrends] = await conn.query(`
      SELECT 
        DATE_FORMAT(start_date, '%Y-%m') as month,
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
        AVG(progress) as avg_progress
      FROM projects
      WHERE start_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(start_date, '%Y-%m')
      ORDER BY month
    `);

    res.json({
      trends: projectTrends
    });
  } finally {
    conn.release();
  }
});