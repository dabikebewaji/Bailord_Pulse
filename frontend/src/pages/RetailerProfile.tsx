import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, TrendingUp, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRetailer } from '@/hooks/use-retailer';
import { retailerAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RetailerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { retailer, isLoading, fetchRetailer } = useRetailer(id || '');
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [isSavingRating, setIsSavingRating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRetailer();
    }
  }, [id, fetchRetailer]);

  const handleRatingOpen = () => {
    setRatingValue(Math.round((retailer?.performance ?? 0) / 20));
    setIsRatingOpen(true);
  };

  const handleRatingSubmit = async () => {
    if (!id) return;
    setIsSavingRating(true);
    try {
      await retailerAPI.updateMetrics(id, { averageRating: ratingValue });
      toast.success('Rating updated');
      setIsRatingOpen(false);
      fetchRetailer();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update rating');
    } finally {
      setIsSavingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading retailer profile...</p>
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Retailer not found</p>
        <Button
          variant="link"
          className="mt-2"
          onClick={() => navigate('/retailers')}
        >
          Back to Retailers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/retailers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{retailer.name}</h1>
            <p className="text-muted-foreground mt-1">Retailer Profile & Performance</p>
          </div>
          <Badge variant={retailer.status === 'active' ? 'default' : 'secondary'} className="text-sm">
            {retailer.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{retailer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{retailer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{retailer.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-success">{retailer.performance}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRatingOpen} title="Set rating">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-secondary rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full"
                    style={{ width: `${retailer.performance}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">Trend</p>
                  <p className="text-sm text-success">↑ 5% this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Joined Date</p>
                  <p className="text-sm text-muted-foreground">{retailer.joinedDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Total Projects</p>
                <p className="text-2xl font-bold">{retailer.projects.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Associated Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {retailer.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">Project ID: {project.id}</p>
                      </div>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  Activity timeline coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  Document management coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Rating</DialogTitle>
              <DialogDescription>
                {retailer.name}'s performance rating.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-1 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className="p-1"
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
            <Button onClick={handleRatingSubmit} disabled={isSavingRating} className="w-full">
              {isSavingRating ? 'Saving...' : 'Save Rating'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default RetailerProfile;
