-- Links a retailer's login (users row) to their business record (retailers
-- row). Previously these were entirely disconnected — a self-registered
-- retailer had no corresponding retailers row at all, so there was nothing
-- for a retailer-facing dashboard to show. SET NULL (not CASCADE): deleting
-- a login shouldn't erase the business's order/project history.

ALTER TABLE retailers
  ADD COLUMN user_id INT NULL UNIQUE,
  ADD CONSTRAINT fk_retailers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
