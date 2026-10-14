-- Posts pulled into /admin from WordPress (sent there by Handoff Hero)
-- remember which WordPress post they came from, so the list knows what's
-- already in and the blog stops showing the WordPress copy once this one
-- is live.
alter table public.posts add column wordpress_id bigint unique;
