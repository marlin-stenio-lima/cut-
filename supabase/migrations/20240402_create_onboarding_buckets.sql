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

-- 1. Allow editors full access (SELECT, INSERT, UPDATE, DELETE) to their own folders

-- Editor Identity Document
CREATE POLICY "Editor Identity All Access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'editor-identity' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'editor-identity' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Editor Face Photo
CREATE POLICY "Editor Face All Access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'editor-face' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'editor-face' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Editor Portfolio Videos
CREATE POLICY "Editor Portfolio All Access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'editor-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'editor-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Allow admins and public to view as needed
CREATE POLICY "Public read for portfolio" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'editor-portfolio');
