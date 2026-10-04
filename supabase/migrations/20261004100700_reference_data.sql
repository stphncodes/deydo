-- National reference data (ADR-013): Nigeria, its 36 states plus FCT, and the
-- wedge category cluster. After this migration, admins manage categories and
-- synonyms in the admin console. Never edit this file once applied.
-- The wedge city and its areas live in supabase/seed/wedge-city.sql.

insert into public.locations (type, name, slug, country_code)
values ('country', 'Nigeria', 'ng', 'NG');

insert into public.locations (parent_id, type, name, slug, country_code)
select ng.id, 'state', s.name, s.slug, 'NG'
from public.locations ng
cross join (values
  ('Abia', 'abia'), ('Adamawa', 'adamawa'), ('Akwa Ibom', 'akwa-ibom'),
  ('Anambra', 'anambra'), ('Bauchi', 'bauchi'), ('Bayelsa', 'bayelsa'),
  ('Benue', 'benue'), ('Borno', 'borno'), ('Cross River', 'cross-river'),
  ('Delta', 'delta'), ('Ebonyi', 'ebonyi'), ('Edo', 'edo'),
  ('Ekiti', 'ekiti'), ('Enugu', 'enugu'), ('Federal Capital Territory', 'fct'),
  ('Gombe', 'gombe'), ('Imo', 'imo'), ('Jigawa', 'jigawa'),
  ('Kaduna', 'kaduna'), ('Kano', 'kano'), ('Katsina', 'katsina'),
  ('Kebbi', 'kebbi'), ('Kogi', 'kogi'), ('Kwara', 'kwara'),
  ('Lagos', 'lagos'), ('Nasarawa', 'nasarawa'), ('Niger', 'niger'),
  ('Ogun', 'ogun'), ('Ondo', 'ondo'), ('Osun', 'osun'),
  ('Oyo', 'oyo'), ('Plateau', 'plateau'), ('Rivers', 'rivers'),
  ('Sokoto', 'sokoto'), ('Taraba', 'taraba'), ('Yobe', 'yobe'),
  ('Zamfara', 'zamfara')
) as s (name, slug)
where ng.type = 'country' and ng.slug = 'ng';

-- Category cluster: "Home & Device Repair" with five leaf services.
insert into public.categories (slug, name, description, sort_order)
values ('home-device-repair', 'Home & Device Repair',
        'Repairs and servicing for your home, power and devices.', 10);

insert into public.categories (parent_id, slug, name, description, sort_order, required_fields)
select p.id, c.slug, c.name, c.description, c.sort_order, c.required_fields::jsonb
from public.categories p
cross join (values
  ('ac-refrigeration-repair', 'AC and refrigeration repair',
   'Air conditioners, fridges and freezers: repair, servicing, gas refill and installation.', 10,
   '[
     {"key": "appliance", "label": "What needs fixing?", "type": "select", "required": true,
      "options": ["Split AC", "Window AC", "Standing AC", "Fridge", "Freezer", "Cold room", "Other"]},
     {"key": "symptom", "label": "What is wrong?", "type": "select", "required": true,
      "options": ["Not cooling", "Leaking water", "Not turning on", "Making noise", "Bad smell",
                  "Needs servicing", "Gas refill", "New installation", "Other"]},
     {"key": "brand", "label": "Brand (if you know it)", "type": "text", "required": false}
   ]'),
  ('electrical-work', 'Electrical work',
   'Wiring, faults, sockets, switches, lights, fans and changeovers.', 20,
   '[
     {"key": "job_type", "label": "What do you need?", "type": "select", "required": true,
      "options": ["Fault or no light", "Sparks or burning smell", "New wiring or rewiring",
                  "Sockets or switches", "Lights or fans", "Changeover or meter", "Other"]},
     {"key": "property_type", "label": "Type of place", "type": "select", "required": true,
      "options": ["House", "Flat", "Shop", "Office", "Other"]}
   ]'),
  ('plumbing', 'Plumbing',
   'Leaks, blocked drains and toilets, taps, water heaters and pumping machines.', 30,
   '[
     {"key": "issue", "label": "What is wrong?", "type": "select", "required": true,
      "options": ["Leaking pipe or tap", "Blocked drain or toilet", "No water", "Water heater",
                  "Pumping machine", "New installation", "Other"]},
     {"key": "location_in_home", "label": "Where is it?", "type": "select", "required": false,
      "options": ["Kitchen", "Bathroom", "Toilet", "Outside", "Whole building"]}
   ]'),
  ('generator-inverter-solar', 'Generator, inverter and solar',
   'Generator repair and servicing, inverters, batteries and solar systems.', 40,
   '[
     {"key": "system", "label": "What needs fixing?", "type": "select", "required": true,
      "options": ["Petrol generator", "Diesel generator", "Inverter", "Solar panels", "Batteries", "Other"]},
     {"key": "symptom", "label": "What is wrong?", "type": "select", "required": true,
      "options": ["Will not start", "Goes off by itself", "Smoke or strange noise", "Not charging",
                  "Low backup time", "Needs servicing", "New installation", "Other"]},
     {"key": "capacity", "label": "Size (for example 3.5kVA), if you know it", "type": "text", "required": false}
   ]'),
  ('phone-laptop-repair', 'Phone and laptop repair',
   'Screens, charging, batteries, water damage and software for phones, laptops and tablets.', 50,
   '[
     {"key": "device", "label": "Which device?", "type": "select", "required": true,
      "options": ["Android phone", "iPhone", "Laptop", "Tablet", "Other"]},
     {"key": "issue", "label": "What is wrong?", "type": "select", "required": true,
      "options": ["Cracked screen", "Not charging", "Battery drains fast", "Will not turn on",
                  "Water damage", "Software or virus", "Speaker or microphone", "Other"]},
     {"key": "brand_model", "label": "Brand and model (if you know it)", "type": "text", "required": false}
   ]')
) as c (slug, name, description, sort_order, required_fields)
where p.slug = 'home-device-repair';

insert into public.category_synonyms (category_id, term, language)
select c.id, s.term, s.language
from public.categories c
join (values
  -- AC and refrigeration
  ('ac-refrigeration-repair', 'ac', 'en'),
  ('ac-refrigeration-repair', 'air conditioner', 'en'),
  ('ac-refrigeration-repair', 'air condition', 'en'),
  ('ac-refrigeration-repair', 'aircon', 'en'),
  ('ac-refrigeration-repair', 'split unit', 'en'),
  ('ac-refrigeration-repair', 'window unit', 'en'),
  ('ac-refrigeration-repair', 'standing unit', 'en'),
  ('ac-refrigeration-repair', 'ac servicing', 'en'),
  ('ac-refrigeration-repair', 'ac gas', 'en'),
  ('ac-refrigeration-repair', 'gas refill', 'en'),
  ('ac-refrigeration-repair', 'fridge', 'en'),
  ('ac-refrigeration-repair', 'refrigerator', 'en'),
  ('ac-refrigeration-repair', 'freezer', 'en'),
  ('ac-refrigeration-repair', 'deep freezer', 'en'),
  ('ac-refrigeration-repair', 'cold room', 'en'),
  ('ac-refrigeration-repair', 'compressor', 'en'),
  ('ac-refrigeration-repair', 'not cooling', 'en'),
  ('ac-refrigeration-repair', 'refrigeration', 'en'),
  ('ac-refrigeration-repair', 'ac technician', 'en'),
  ('ac-refrigeration-repair', 'ac no dey cool', 'pcm'),
  ('ac-refrigeration-repair', 'fridge no dey cool', 'pcm'),
  ('ac-refrigeration-repair', 'freezer no dey freeze', 'pcm'),
  ('ac-refrigeration-repair', 'ac dey leak', 'pcm'),
  ('ac-refrigeration-repair', 'ac dey drip water', 'pcm'),
  ('ac-refrigeration-repair', 'ac dey make noise', 'pcm'),
  -- Electrical
  ('electrical-work', 'electrician', 'en'),
  ('electrical-work', 'electrical', 'en'),
  ('electrical-work', 'wiring', 'en'),
  ('electrical-work', 'rewiring', 'en'),
  ('electrical-work', 'no light', 'en'),
  ('electrical-work', 'socket', 'en'),
  ('electrical-work', 'switch', 'en'),
  ('electrical-work', 'fuse', 'en'),
  ('electrical-work', 'circuit breaker', 'en'),
  ('electrical-work', 'short circuit', 'en'),
  ('electrical-work', 'sparks', 'en'),
  ('electrical-work', 'burning smell', 'en'),
  ('electrical-work', 'bulb', 'en'),
  ('electrical-work', 'ceiling fan', 'en'),
  ('electrical-work', 'changeover', 'en'),
  ('electrical-work', 'prepaid meter', 'en'),
  ('electrical-work', 'distribution board', 'en'),
  ('electrical-work', 'nepa', 'pcm'),
  ('electrical-work', 'light no dey', 'pcm'),
  ('electrical-work', 'wire don burn', 'pcm'),
  ('electrical-work', 'socket dey spark', 'pcm'),
  ('electrical-work', 'light dey blink', 'pcm'),
  ('electrical-work', 'one side no get light', 'pcm'),
  -- Plumbing
  ('plumbing', 'plumber', 'en'),
  ('plumbing', 'plumbing', 'en'),
  ('plumbing', 'pipe', 'en'),
  ('plumbing', 'leaking pipe', 'en'),
  ('plumbing', 'burst pipe', 'en'),
  ('plumbing', 'tap', 'en'),
  ('plumbing', 'toilet', 'en'),
  ('plumbing', 'water closet', 'en'),
  ('plumbing', 'blocked toilet', 'en'),
  ('plumbing', 'blocked drain', 'en'),
  ('plumbing', 'sink', 'en'),
  ('plumbing', 'shower', 'en'),
  ('plumbing', 'water heater', 'en'),
  ('plumbing', 'pumping machine', 'en'),
  ('plumbing', 'water pump', 'en'),
  ('plumbing', 'borehole', 'en'),
  ('plumbing', 'overhead tank', 'en'),
  ('plumbing', 'soakaway', 'en'),
  ('plumbing', 'pipe dey leak', 'pcm'),
  ('plumbing', 'water no dey run', 'pcm'),
  ('plumbing', 'toilet don block', 'pcm'),
  ('plumbing', 'tap dey drip', 'pcm'),
  ('plumbing', 'water dey waste', 'pcm'),
  -- Generator, inverter and solar
  ('generator-inverter-solar', 'generator', 'en'),
  ('generator-inverter-solar', 'gen', 'pcm'),
  ('generator-inverter-solar', 'genset', 'en'),
  ('generator-inverter-solar', 'diesel generator', 'en'),
  ('generator-inverter-solar', 'petrol generator', 'en'),
  ('generator-inverter-solar', 'i better pass my neighbour', 'pcm'),
  ('generator-inverter-solar', 'carburettor', 'en'),
  ('generator-inverter-solar', 'carburetor', 'en'),
  ('generator-inverter-solar', 'spark plug', 'en'),
  ('generator-inverter-solar', 'generator servicing', 'en'),
  ('generator-inverter-solar', 'inverter', 'en'),
  ('generator-inverter-solar', 'solar', 'en'),
  ('generator-inverter-solar', 'solar panel', 'en'),
  ('generator-inverter-solar', 'inverter battery', 'en'),
  ('generator-inverter-solar', 'battery', 'en'),
  ('generator-inverter-solar', 'charge controller', 'en'),
  ('generator-inverter-solar', 'kva', 'en'),
  ('generator-inverter-solar', 'gen no gree start', 'pcm'),
  ('generator-inverter-solar', 'gen no dey start', 'pcm'),
  ('generator-inverter-solar', 'gen dey smoke', 'pcm'),
  ('generator-inverter-solar', 'gen mechanic', 'pcm'),
  ('generator-inverter-solar', 'inverter no dey charge', 'pcm'),
  ('generator-inverter-solar', 'battery don die', 'pcm'),
  -- Phone and laptop
  ('phone-laptop-repair', 'phone', 'en'),
  ('phone-laptop-repair', 'smartphone', 'en'),
  ('phone-laptop-repair', 'android', 'en'),
  ('phone-laptop-repair', 'iphone', 'en'),
  ('phone-laptop-repair', 'laptop', 'en'),
  ('phone-laptop-repair', 'computer', 'en'),
  ('phone-laptop-repair', 'macbook', 'en'),
  ('phone-laptop-repair', 'tablet', 'en'),
  ('phone-laptop-repair', 'ipad', 'en'),
  ('phone-laptop-repair', 'cracked screen', 'en'),
  ('phone-laptop-repair', 'broken screen', 'en'),
  ('phone-laptop-repair', 'screen replacement', 'en'),
  ('phone-laptop-repair', 'charging port', 'en'),
  ('phone-laptop-repair', 'phone battery', 'en'),
  ('phone-laptop-repair', 'battery', 'en'),
  ('phone-laptop-repair', 'water damage', 'en'),
  ('phone-laptop-repair', 'flashing', 'en'),
  ('phone-laptop-repair', 'virus', 'en'),
  ('phone-laptop-repair', 'keyboard', 'en'),
  ('phone-laptop-repair', 'phone engineer', 'pcm'),
  ('phone-laptop-repair', 'screen don crack', 'pcm'),
  ('phone-laptop-repair', 'phone no dey charge', 'pcm'),
  ('phone-laptop-repair', 'laptop no gree on', 'pcm'),
  ('phone-laptop-repair', 'phone fall inside water', 'pcm'),
  ('phone-laptop-repair', 'phone dey hang', 'pcm')
) as s (category_slug, term, language)
  on s.category_slug = c.slug::text;
