-- Insert default FOUNDRY feature flag
INSERT INTO feature_flags (flag_name, enabled, description) 
VALUES ('FOUNDRY', false, 'Enable Palantir Foundry integration in the Data & Analytics section')
ON CONFLICT (flag_name) DO NOTHING;