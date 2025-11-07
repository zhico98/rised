export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 500,
  PLAYER_WIDTH: 56,
  PLAYER_HEIGHT: 56,
  GRAVITY: 0.2,
  MOVEMENT_SPEED: 3,
  JUMP_STRENGTH: -7,
  TREE_GENERATION_INTERVAL: 300,
  OBSTACLE_WIDTH: 40,
  OBSTACLE_HEIGHT: 40,
  FINN_OBSTACLE_WIDTH: 40,
  FINN_OBSTACLE_HEIGHT: 40,
}

export const COLORS = {
  sky: "#87CEEB",
  ground: "#D2B48C",
  snow: "#FFFAFA",
  skiTrail: "#A9A9A9",
}

export const IMAGES = {
  BACKGROUND: "/sky-background.png",
  CHARACTERS: [
    {
      name: "Soar",
      sprite: "/soar.png",
      widthMultiplier: 1.2,
      heightMultiplier: 1.2,
    },
    {
      name: "Captain Beef",
      sprite: "/captain-beef.png",
      widthMultiplier: 1.3,
      heightMultiplier: 1.3,
    },
    {
      name: "Thief",
      sprite: "/thief.png", // Changed from .jpg to .png to use pixel art
      widthMultiplier: 1.3,
      heightMultiplier: 1.3,
    },
    {
      name: "Hostess",
      sprite: "/hostess.png", // Changed from .jpg to .png to use pixel art
      widthMultiplier: 1.2,
      heightMultiplier: 1.2,
    },
  ],
  TREES: ["/rain-cloud.png"],
  SNOWMEN: ["/rain-cloud.png"],
  FINN_OBSTACLES: ["/rageblocks.gif"],
}

export const FONTS = {
  PIXEL: '"8-BIT WONDER", monospace',
}
