module.exports = {
  page: [
    {
      title: "Test",
      source: "/work/data/source",
      target: "/work/data/target",
      ignore: "/work/data/ignore",
      default: {
        type: "person",
        truncated: 0.0,
        occluded: 0,
        alpha: 0,
        bbox: [1131.0, 449.0, 1324.0, 659.0],
        dimensions: [-1, -1, -1],
        location: [-1000, -1000, -1000],
        rotation_y: -10,
        score: 1,
      },
      props: {
        screenSize: [1280, 720],
        form: {
          type: {
            type: "select",
            label: "Type",
            default: "car",
            options: {
              car: "Car",
              van: "Van",
              truck: "Truck",
              pedestrian: "Pedestrian",
              person_sitting: "Person sitting",
              cyclist: "Cyclist",
              tram: "Tram",
              misc: "Misc",
              dont_care: "Don't care",
            },
          },
          truncated: {
            type: "number",
            label: "Truncated",
          },
          occluded: {
            type: "select",
            label: "Occluded",
            // default: "0",
            options: {
              0: "Fully visible",
              1: "Partly visible",
              2: "largely visible",
              3: "Unknown",
            },
          },
          alpha: {
            type: "number",
            label: "Alpha",
          },
          rotation_y: {
            type: "number",
            label: "Rotation Y",
          },
          score: {
            type: "number",
            label: "Score",
          },
        },
      },
    },
  ],
  TRANSLATION: {},
};
