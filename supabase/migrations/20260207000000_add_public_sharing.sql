-- Add is_public column to pages table for public sharing
alter table "public"."pages" add column "is_public" boolean default false;

-- Add policy to allow public access to shared pages
create policy "Public pages are viewable by everyone"
on "public"."pages"
as permissive
for select
to public
using ((is_public = true));
