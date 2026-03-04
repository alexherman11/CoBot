// Shared constants for VexCoder

const PORTS = Array.from({ length: 12 }, (_, i) => ({
  label: `Port ${i + 1}`,
  value: `Ports.PORT${i + 1}`
}));

const SLOTS = Array.from({ length: 8 }, (_, i) => ({
  label: `Slot ${i + 1}`,
  value: i + 1
}));

const DIRECTIONS = {
  FORWARD: 'FORWARD',
  REVERSE: 'REVERSE',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT'
};

const UNITS = {
  MM: 'MM',
  DEGREES: 'DEGREES',
  SECONDS: 'SECONDS',
  PERCENT: 'PERCENT'
};

const VEX_USB_VENDOR_ID = '2888';

module.exports = { PORTS, SLOTS, DIRECTIONS, UNITS, VEX_USB_VENDOR_ID };
