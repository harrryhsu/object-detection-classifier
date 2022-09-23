const fs = require("fs");
const path = require("path");
const config = require("./config");

const okay = (res, data) => {
  res.contentType("application/json").status(200).send({
    status: true,
    data: data,
  });
};

const error = (res) => (msg) => {
  console.log(msg);
  res.contentType("application/json").status(500).send({
    status: false,
    message: msg.toString(),
    code: "ER_UNKNOWN",
  });
};

const getAllFiles = function (
  dirPath,
  filter = "",
  max = -1,
  arrayOfFiles = []
) {
  if (max !== -1 && arrayOfFiles.length > max)
    return arrayOfFiles.slice(0, max);
  var files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(
        dirPath + "/" + file,
        filter,
        max,
        arrayOfFiles
      );
    } else if (file.includes(filter)) {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  if (max !== -1) arrayOfFiles = arrayOfFiles.slice(0, max);

  return arrayOfFiles;
};

const ensureDir = (_path) =>
  !fs.existsSync(_path) &&
  fs.mkdirSync(path.dirname(_path), { recursive: true });

const ext = (_path, ext) =>
  path.format({ ...path.parse(_path), base: "", ext });

config.page.forEach((page) => {
  const targetImagePath = path.join(page.target, "image");
  const targetLabelPath = path.join(page.target, "label");
  const ignorePath = page.ignore;
  ensureDir(targetImagePath);
  ensureDir(targetLabelPath);
  ensureDir(ignorePath);
});

const mapDefault = (data, def) =>
  Object.keys(def).reduce(
    (acc, key) => ({
      ...acc,
      [key]: data[key] == null || data[key] == "" ? def[key] : data[key],
    }),
    {}
  );

const shapeToObject = ({ addition, data: [{ x, y }, width, height] }) => ({
  type: addition.type,
  truncated: addition.truncated,
  occluded: addition.occluded,
  alpha: addition.alpha,
  bbox: [x, y, x + width, y + height],
  dimensions: null,
  location: null,
  rotation_y: addition.rotation_y,
  score: addition.score,
});

const objectToLabel = (d) =>
  `${d.type} ${d.truncated} ${d.occluded} ${d.alpha} ${d.bbox[0]} ${d.bbox[1]} ${d.bbox[2]} ${d.bbox[3]} ${d.dimensions[0]} ${d.dimensions[1]} ${d.dimensions[2]} ${d.location[0]} ${d.location[1]} ${d.location[2]} ${d.rotation_y}`;

const labelProp = {
  bbox: 4,
  dimensions: 3,
  location: 3,
};

const labelToObject = (label, format) => {
  const seg = label.split(" ");
  return format.reduce(
    (acc, v) => ({
      ...acc,
      [v]: labelProp.hasOwnProperty(v)
        ? seg.splice(0, labelProp[v])
        : seg.shift(),
    }),
    {}
  );
};

const scaleUp = (label, size) => [
  label[0] * size[0],
  label[1] * size[1],
  label[2] * size[0],
  label[3] * size[1],
];

const scaleDown = (label, size) => [
  label[0] / size[0],
  label[1] / size[1],
  label[2] / size[0],
  label[3] / size[1],
];

module.exports = (app) => {
  app.get("/api/metadata", (req, res) => {
    return okay(res, config);
  });

  app.get("/api/list", (req, res) => {
    const { id } = req.query;
    const page = config.page[parseInt(id)];
    const files = getAllFiles(page.source.image, page.search ?? "", 50).map(
      (x) => {
        const relativePath = path.relative(page.source.image, x);
        let labels = [];
        if (page.source.label) {
          const labelPath = path.join(
            page.source.label,
            ext(relativePath, ".txt")
          );
          if (fs.existsSync(labelPath)) {
            const rawLabel = fs.readFileSync(labelPath).toString();
            labels = rawLabel
              .split("\n")
              .filter((x) => x != "")
              .map((x) => labelToObject(x, page.source.labelFormat));
            labels.forEach(
              (label) => (label.bbox = scaleDown(label.bbox, page.screenSize))
            );
          }
        }
        return {
          path: relativePath,
          data: labels,
        };
      }
    );

    return okay(res, files);
  });

  app.get("/api/image", (req, res) => {
    const { imagePath, id } = req.query;
    const page = config.page[parseInt(id)];
    const sourcePath = path.join(page.source.image, imagePath);
    const data = fs.readFileSync(sourcePath);

    return res.status(200).contentType("image/jpg").send(data);
  });

  app.post("/api/submit", (req, res) => {
    const { id, data, file } = req.body;
    const page = config.page[parseInt(id)];
    const sourceImagePath = path.join(page.source.image, file);
    const targetImagePath = path.join(page.target, "image", file);
    const targetLabelPath = path.join(page.target, "label", ext(file, ".txt"));

    ensureDir(targetImagePath);
    ensureDir(targetLabelPath);

    const label = data
      .map((d) => mapDefault(shapeToObject(d), page.default))
      .map((x) => {
        x.bbox = scaleUp(x.bbox, page.screenSize);
        return x;
      })
      .map(objectToLabel)
      .join("\n");

    fs.renameSync(sourceImagePath, targetImagePath);
    fs.writeFileSync(targetLabelPath, label);

    if (page.source.label) {
      const sourceLabelPath = path.join(page.source.label, ext(file, ".txt"));
      fs.unlinkSync(sourceLabelPath);
    }

    return okay(res);
  });

  app.post("/api/ignore", (req, res) => {
    const { id, file } = req.body;
    const page = config.page[parseInt(id)];

    const sourceImagePath = path.join(page.source.image, file);
    const ignoreImagePath = path.join(page.ignore, "image", file);
    ensureDir(ignoreImagePath);
    fs.renameSync(sourceImagePath, ignoreImagePath);

    if (page.source.label) {
      const sourceLabelPath = path.join(page.source.label, ext(file, ".txt"));
      const ignoreLabelPath = path.join(
        page.ignore,
        "label",
        ext(file, ".txt")
      );
      ensureDir(ignoreLabelPath);
      fs.renameSync(sourceLabelPath, ignoreLabelPath);
    }

    return okay(res);
  });
};
