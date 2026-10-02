BEGIN;
UPDATE public.gift_catalog SET active=false WHERE id='carpet-extractor';
INSERT INTO public.gift_catalog(id,name,active) VALUES
('toaster','Waffle, grill & sandwich maker',true),
('thermal-fogger','Thermal fogger',true),
('cookware-4-piece','Pots & frying pan set',true),
('cookware-10-piece','10-piece cookware set',true),
('food-processor','Food processor',true),
('smart-tv','55-inch smart TV',true)
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,active=EXCLUDED.active;
COMMIT;

