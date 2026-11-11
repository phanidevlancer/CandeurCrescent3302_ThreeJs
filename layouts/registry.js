// Layout options per room. Every room automatically also offers "Original (version 1)".
// To add an option: create layouts/<room-slug>/optionN.js exporting { id, name, summary, facts, apply(ctx) }
// and list it here. `defaults` picks the option shown first.
export const ROOM_LAYOUTS = {
  'Master bedroom': ['master-bedroom/option1.js', 'master-bedroom/option2.js', 'master-bedroom/option3.js', 'master-bedroom/option4.js'],
  'Formal hall': ['formal-hall/option1.js'],
  'Living and dining': ['living-and-dining/option1.js'],
  'Kitchen': ['kitchen/option1.js'],
  'Dress': ['dress/option1.js'],          // passage wall variation; the Buddha stays the default (Original)
  'Bedroom 2': ['bedroom-2/option1.js'],
  // owner 2026-11-11: the owners' Bed 01 model in bedroom 1 (fluted oak headboard panel kept)
  'Bedroom 1': ['bedroom-1/option1.js'],
  // owner 2026-11-10: switchable bathroom designs (original layout kept)
  'Master toilet': ['master-toilet/option1.js'],
  // owner 2026-11-11: switchable puja door on the open alcove side
  Puja: ['puja/option1.js'],
  // owner 2026-11-11: every balcony chair -> the owners' wicker armchair model (layouts/balcony-chairs.js)
  'Master balcony': ['master-balcony/option1.js'],
  'Family balcony': ['family-balcony/option1.js'],
  'Bedroom 1 balcony': ['bedroom-1-balcony/option1.js'],
  // owner 2026-11-11: copper sink on the east wall, east wall to the ceiling, washer + west sink removed
  Utility: ['utility/option1.js'],
};
export const DEFAULTS = {
  // owner 2026-11-12: Option 3 (gaming wall on Hall 1 wall + walnut balcony wall, Beige S-curve + study cabinet, Dreamburst taupe)
  'Master bedroom': 'option3',
  'Formal hall': 'option1',
  'Living and dining': 'option1',
  'Kitchen': 'option1',
  'Dress': 'option1',
  // owner 2026-11-11: Bedroom 2 = dark study wall + the owners' Computer Desk model; Bedroom 1 = the owners' Bed 01 model
  'Bedroom 2': 'option1',
  'Bedroom 1': 'option1',
  // walk-in designs default = Buddha + original wardrobe; bathroom designs default 'original'
  'Master toilet': 'option1',
  // puja door option (door slot default = the owner's teak / brass / cane reference)
  Puja: 'option1',
  // balconies: wicker armchair model (owner 2026-11-11)
  'Master balcony': 'option1',
  'Family balcony': 'option1',
  'Bedroom 1 balcony': 'option1',
  Utility: 'option1',
};
