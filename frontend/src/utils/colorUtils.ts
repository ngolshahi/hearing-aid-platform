// Color utility functions for the hearing aid platform

// Map of color categories with their associated hex codes
interface ColorGroup {
  name: string;         // Display name for the color group
  hexCodes: string[];   // List of hex codes that belong to this color
  displayColor: string; // Representative hex code for display
}

// Map of color groups - each group contains similar color shades
export const colorGroups: ColorGroup[] = [
  {
    name: 'Chestnut Brown',
    hexCodes: ['#4e312d', '#5e413d', '#3e211d', '#6e514d'], 
    displayColor: '#4e312d'
  },
  {
    name: 'Silver',
    hexCodes: ['#bec2cb', '#c0c4cd', '#aeb2bb', '#d0d4dd', '#C0C0C0'],
    displayColor: '#bec2cb'
  },
  {
    name: 'Graphite Gray',
    hexCodes: ['#708090', '#607080', '#505060', '#808090', '#778899'],
    displayColor: '#708090'
  },
  {
    name: 'Caramel',
    hexCodes: ['#CD7F32', '#c07022', '#d08042', '#b06022', '#e09052'],
    displayColor: '#CD7F32'
  },
  {
    name: 'Beige',
    hexCodes: ['#F7E7CE', '#e7d7be', '#f5e5c0', '#fdf5e6', '#F5F5DC'],
    displayColor: '#F7E7CE'
  },
  {
    name: 'White',
    hexCodes: ['#FFFFFF', '#FDFEFF', '#F0F0F0', '#FAFAFA', '#F5F5F5'],
    displayColor: '#FFFFFF'
  },
  {
    name: 'Black',
    hexCodes: ['#000000', '#101010', '#0A0A0A', '#151515', '#1A1A1A'],
    displayColor: '#000000'
  }
];

// Get color group name from a hex code
export const getColorGroupByHex = (hexCode: string): ColorGroup | undefined => {
  const normalizedHex = hexCode.toLowerCase();
  return colorGroups.find(group => 
    group.hexCodes.some(groupHex => 
      groupHex.toLowerCase() === normalizedHex
    )
  );
};

// Get color name from a hex code
export const getColorName = (hexCode: string): string => {
  const colorGroup = getColorGroupByHex(hexCode);
  return colorGroup ? colorGroup.name : 'Other';
};

// Get representative hex code for a color group name
export const getDisplayColorByName = (colorName: string): string => {
  const group = colorGroups.find(g => g.name === colorName);
  return group ? group.displayColor : '#CCCCCC';
};

// Get all hex codes that belong to a color group
export const getHexCodesByColorName = (colorName: string): string[] => {
  const group = colorGroups.find(g => g.name === colorName);
  return group ? group.hexCodes : [];
};

// Check if a hearing aid color matches any of the selected color groups
export const hearingAidHasSelectedColor = (hearingAidColors: string[], selectedColorGroups: string[]): boolean => {
  // For each hearing aid color, see if it belongs to any of the selected color groups
  return hearingAidColors.some(hearingAidColor => {
    const colorGroup = getColorGroupByHex(hearingAidColor);
    return colorGroup && selectedColorGroups.includes(colorGroup.name);
  });
};

// Get all unique color groups from a list of hex codes
export const getUniqueColorGroups = (hexCodes: string[]): ColorGroup[] => {
  const uniqueGroupNames = new Set<string>();
  const uniqueGroups: ColorGroup[] = [];

  hexCodes.forEach(hex => {
    const group = getColorGroupByHex(hex);
    if (group && !uniqueGroupNames.has(group.name)) {
      uniqueGroupNames.add(group.name);
      uniqueGroups.push(group);
    }
  });

  return uniqueGroups;
}; 