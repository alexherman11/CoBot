// Block type definitions - 6 block types with parameter schemas
const BlockDefinitions = {
  types: {
    onStart: {
      id: 'onStart',
      label: 'On Start',
      icon: '\u25B6',
      color: 'start',
      category: 'events',
      isContainer: false,
      isEntry: true,
      params: [],
      template: '# VEX IQ Robot Program'
    },
    forward: {
      id: 'forward',
      label: 'Forward',
      icon: '\u2B06',
      color: 'forward',
      category: 'motion',
      isContainer: false,
      params: [
        { name: 'distance', type: 'number', default: 200, label: 'mm', min: 0, max: 10000 }
      ],
      template: 'drivetrain.drive_for(FORWARD, {distance}, MM)'
    },
    backward: {
      id: 'backward',
      label: 'Backward',
      icon: '\u2B07',
      color: 'backward',
      category: 'motion',
      isContainer: false,
      params: [
        { name: 'distance', type: 'number', default: 200, label: 'mm', min: 0, max: 10000 }
      ],
      template: 'drivetrain.drive_for(REVERSE, {distance}, MM)'
    },
    turn: {
      id: 'turn',
      label: 'Turn',
      icon: '\u21BB',
      color: 'turn',
      category: 'motion',
      isContainer: false,
      params: [
        { name: 'direction', type: 'select', default: 'RIGHT', options: ['LEFT', 'RIGHT'] },
        { name: 'angle', type: 'number', default: 90, label: '\u00B0', min: 0, max: 360 }
      ],
      template: 'drivetrain.turn_for({direction}, {angle}, DEGREES)'
    },
    repeat: {
      id: 'repeat',
      label: 'Repeat',
      icon: '\uD83D\uDD01',
      color: 'repeat',
      category: 'control',
      isContainer: true,
      params: [
        { name: 'count', type: 'number', default: 3, label: 'times', min: 1, max: 100 }
      ],
      template: 'for i in range({count}):'
    },
    while: {
      id: 'while',
      label: 'While',
      icon: '\u267B',
      color: 'while',
      category: 'control',
      isContainer: true,
      params: [
        {
          name: 'condition',
          type: 'select',
          default: 'True',
          options: [
            'True',
            'bumper_1.pressing()',
            'not bumper_1.pressing()',
            'distance_1.is_object_detected()',
            'not distance_1.is_object_detected()',
            'distance_1.object_distance(MM) > 200',
            'distance_1.object_distance(MM) < 100'
          ],
          labels: [
            'Forever',
            'Bumper pressed',
            'Bumper not pressed',
            'Object detected',
            'No object detected',
            'Distance > 200mm',
            'Distance < 100mm'
          ]
        }
      ],
      template: 'while {condition}:'
    }
  },

  getType(typeId) {
    return this.types[typeId];
  },

  getAllTypes() {
    return Object.values(this.types);
  }
};
