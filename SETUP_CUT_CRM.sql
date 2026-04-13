-- 1. Create the Administration Pipeline
INSERT INTO crm_pipelines (id, name)
VALUES (gen_random_uuid(), 'CRM Projetos')
RETURNING id;

-- 2. Create the stages for the new pipeline
-- Replace [PIPELINE_ID] with the ID from the previous step
DO $$
DECLARE
    new_pipeline_id uuid;
BEGIN
    -- Get the ID of the pipeline we just created (or find it if it exists)
    SELECT id INTO new_pipeline_id FROM crm_pipelines WHERE name = 'CRM Projetos' LIMIT 1;
    
    IF new_pipeline_id IS NOT NULL THEN
        -- Delete existing stages for this pipeline if any (to avoid duplicates)
        DELETE FROM crm_stages WHERE pipeline_id = new_pipeline_id;
        
        -- Insert the new stages
        INSERT INTO crm_stages (pipeline_id, name, "order") VALUES
        (new_pipeline_id, 'Novo projeto', 10),
        (new_pipeline_id, 'Proposta', 20),
        (new_pipeline_id, 'Projeto em edição', 30),
        (new_pipeline_id, 'Projeto em aprovação', 40),
        (new_pipeline_id, 'Análise', 50),
        (new_pipeline_id, 'Finalizado', 60),
        (new_pipeline_id, 'Pendentes de pagamento', 70);
    END IF;
END $$;
