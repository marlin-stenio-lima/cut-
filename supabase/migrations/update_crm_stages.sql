-- This migration replaces the existing CRM Stages with the ones requested by the user
DO $$
DECLARE
    v_pipeline_id uuid;
BEGIN
    SELECT id INTO v_pipeline_id FROM crm_pipelines WHERE name = 'Vendas Imóveis' LIMIT 1;
    
    -- Rename pipeline to Plataforma
    UPDATE crm_pipelines SET name = 'Pipeline da Plataforma' WHERE id = v_pipeline_id;

    -- Delete old stages
    DELETE FROM crm_stages WHERE pipeline_id = v_pipeline_id;

    -- Insert new stages
    INSERT INTO crm_stages (pipeline_id, name, "order", target_days) VALUES
    (v_pipeline_id, 'Novo projeto', 1, 2),
    (v_pipeline_id, 'Proposta', 2, 3),
    (v_pipeline_id, 'Projeto em edição', 3, 7),
    (v_pipeline_id, 'Projeto em aprovação', 4, 3),
    (v_pipeline_id, 'Análise', 5, 2),
    (v_pipeline_id, 'Finalizado', 6, 0),
    (v_pipeline_id, 'Pendentes de pagamento', 7, 0);

END $$;
