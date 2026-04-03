-- Create storage buckets for editor onboarding if they don't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'editor-identity', 'editor-identity', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'editor-identity');

INSERT INTO storage.buckets (id, name, public)
SELECT 'editor-face', 'editor-face', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'editor-face');

INSERT INTO storage.buckets (id, name, public)
SELECT 'editor-portfolio', 'editor-portfolio', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'editor-portfolio');

-- RLS Policies for Storage Buckets
-- 1. Allow editors to upload their own files
CREATE POLICY "Allow editors to upload identity docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'editor-identity' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow editors to upload face photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'editor-face' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow editors to upload portfolio videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'editor-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Allow admins to view private docs
-- (Replace with actual admin check logic if needed, for now public read on public buckets works)
CREATE POLICY "Public read for portfolio" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'editor-portfolio');
