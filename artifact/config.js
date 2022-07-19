module.exports = {
  page: [
    {
      title: "Test",
      source: {
        image: "/work/data/origin/source",
      },
      target: "/work/data/origin/target",
      ignore: "/work/data/origin/ignore",
      search: "",
      screenSize: [1920, 1080],
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
            default: 0,
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
    {
      title: "Test Reprocess",
      source: {
        image: "/work/data/existing/source/image",
        label: "/work/data/existing/source/label",
        labelFormat: [
          "type",
          "truncated",
          "occluded",
          "alpha",
          "bbox",
          "dimensions",
          "location",
          "rotation_y",
          "score",
        ],
      },
      target: "/work/data/existing/target",
      ignore: "/work/data/existing/ignore",
      search: "",
      screenSize: [1920, 1080],
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
            default: 0,
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
            default: 1,
          },
        },
      },
    },
  ],
  TRANSLATION: {},
};
