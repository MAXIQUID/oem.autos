-- Remove the fabricated TwentyThirty donor catalog. These VINs and listings
-- were invented for a demo and must not remain as inventory.

delete from inventory
where vin in (
  'WBA8E9C55HNU12345',
  '1FTEW1EP6JFA12345',
  '19XFB2F50FE012345',
  '4T1BF1FK7EU123456',
  'JF1VA1A68G9801234',
  '1GCUYDED4KZ123456'
);

delete from vehicle_bom
where vin in (
  'WBA8E9C55HNU12345',
  '1FTEW1EP6JFA12345',
  '19XFB2F50FE012345',
  '4T1BF1FK7EU123456',
  'JF1VA1A68G9801234',
  '1GCUYDED4KZ123456'
);

delete from vehicles
where vin in (
  'WBA8E9C55HNU12345',
  '1FTEW1EP6JFA12345',
  '19XFB2F50FE012345',
  '4T1BF1FK7EU123456',
  'JF1VA1A68G9801234',
  '1GCUYDED4KZ123456'
);
