import React, { useContext, useEffect } from "react";
import useState from "react-usestateref";

// core components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import { UtilContext } from "context/UtilContext";
import AddIcon from "@material-ui/icons/Add";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { Fab, Tooltip } from "@material-ui/core";
import { DetectionRect } from "./Shape";

import { Stage, Layer } from "react-konva/lib/ReactKonvaCore";
import Form from "components/Form";

import EmptyImage from "assets/img/empty.png";

const uuidv4 = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

const SCREEN_SIZE = [1280, 720];

const apply = ({ data: [{ x, y }, width, height], ...rest }, opx, opy) => ({
  ...rest,
  data: [{ x: opx(x), y: opy(y) }, opx(width), opy(height)],
});

const scaleUp = (data) =>
  apply(
    data,
    (x) => x * SCREEN_SIZE[0],
    (y) => y * SCREEN_SIZE[1]
  );

const scaleDown = (data) =>
  apply(
    data,
    (x) => x / SCREEN_SIZE[0],
    (y) => y / SCREEN_SIZE[1]
  );

export default function Drawer(props) {
  const { id, form } = props;
  const { setError, setSuccess, api, setDialogSrc, t } = useContext(
    UtilContext
  );
  const [shapeData, setShapeData, shapeDataRef] = useState([]);
  const [images, setImage, imageRef] = useState([]);
  const [onAdd, setOnAdd] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [currentDrawing, setCurrentDrawing, currentDrawingRef] = useState(null);
  const [submitted, setSubmitted, submittedRef] = useState([]);
  const currentImage = images[0]?.path;
  const setDataAux = (i) => (entry) => {
    setShapeData([
      ...shapeData.slice(0, i),
      {
        ...shapeData[i],
        data: entry,
      },
      ...shapeData.slice(i + 1),
    ]);
  };

  const openDialog = (entry) => {
    setDialogSrc(() => (
      <Form
        config={form}
        existingForm={entry.addition}
        onUpdate={(data) =>
          setShapeData([
            ...shapeDataRef.current.filter((x) => x.id != entry.id),
            { ...entry, addition: data },
          ]) || setDialogSrc(null)
        }
        onDelete={(data) =>
          setShapeData([
            ...shapeDataRef.current.filter((x) => x.id != entry.id),
          ]) || setDialogSrc(null)
        }
      />
    ));
  };

  const next = () => {
    setImage(([, ...rest]) => rest);
    setShapeData([]);
    setOnAdd(false);
  };

  useEffect(() => {
    if (!empty && images.length == 0) {
      api
        .GetList()
        .then((res) => {
          if (res.length === 0) setEmpty(true);
          setImage(
            res.map(({ path, data }) => ({
              path: path,
              data: data
                .map(({ bbox, ...rest }) => ({
                  addition: rest,
                  data: [
                    { x: parseFloat(bbox[0]), y: parseFloat(bbox[1]) },
                    bbox[2] - bbox[0],
                    bbox[3] - bbox[1],
                  ],
                  key: "rect",
                  id: uuidv4(),
                }))
                .map(scaleUp),
            }))
          );
        })
        .catch(setError);
    } else if (images.length != 0) {
      setShapeData(images[0].data ?? []);
    }
  }, [images]);

  useEffect(() => {
    const onDrawEnd = () => {
      if (currentDrawingRef.current) {
        setShapeData([...shapeDataRef.current, currentDrawingRef.current]);
        setCurrentDrawing(null);
        setOnAdd(false);
        openDialog(shapeDataRef.current[shapeDataRef.current.length - 1]);
      }
    };

    window.addEventListener("mouseup", onDrawEnd);
    return () => window.removeEventListener("mouseup", onDrawEnd);
  }, []);

  return (
    <div key={id}>
      <GridContainer style={{ minHeight: "500px" }}>
        <GridItem xs={12} sm={12} md={12} id="traffic-container">
          <div style={{ position: "relative", margin: "50px auto 20px auto" }}>
            <img
              width={SCREEN_SIZE[0]}
              height={SCREEN_SIZE[1]}
              src={
                images.length === 0 ? EmptyImage : api.GetImageSrc(currentImage)
              }
            />
            <Stage
              id="test"
              width={SCREEN_SIZE[0]}
              height={SCREEN_SIZE[1]}
              style={{
                position: "absolute",
                margin: "auto",
                top: 0,
                cursor: onAdd ? "crosshair" : "default",
              }}
              onMouseDown={(e) => {
                if (onAdd) {
                  const x = e.evt.offsetX;
                  const y = e.evt.offsetY;
                  setCurrentDrawing({
                    id: uuidv4(),
                    key: "rect",
                    data: [{ x, y }, 0, 0],
                    addition: {},
                  });
                }
              }}
              onMouseMove={(e) => {
                const currentDrawing = currentDrawingRef.current;
                if (currentDrawing) {
                  var { offsetX: nx, offsetY: ny } = e.evt;
                  var { x: px, y: py } = currentDrawing.data[0];
                  setCurrentDrawing({
                    ...currentDrawing,
                    data: [
                      {
                        x: px,
                        y: py,
                      },
                      nx - px,
                      ny - py,
                    ],
                  });
                }
              }}
            >
              <Layer>
                {shapeData
                  .concat(currentDrawing ? [currentDrawing] : [])
                  .map((entry, i) => {
                    return (
                      <DetectionRect
                        key={i}
                        pts={entry.data}
                        setPts={setDataAux(i)}
                        name={entry.addition.type}
                        addition={entry.addition}
                        onClick={() => openDialog(entry)}
                      />
                    );
                  })}
              </Layer>
            </Stage>
            <Fab
              color="primary"
              style={{
                position: "absolute",
                bottom: "20px",
                right: "260px",
              }}
              disabled={submitted.length === 0}
              onClick={() => {
                const last = submittedRef.current[0];
                api
                  .Rewind({ file: last.currentImage, type: last.type })
                  .then(() => {
                    const data = last.data.map(scaleUp);
                    setSubmitted(([, ...x]) => x);
                    setImage((x) => [{ path: last.currentImage, data }, ...x]);
                    setShapeData(data);
                    setOnAdd(false);
                  })
                  .catch(setError);
              }}
            >
              <Tooltip title={t("Rewind")}>
                <ArrowBackIcon />
              </Tooltip>
            </Fab>
            <Fab
              color="primary"
              style={{
                position: "absolute",
                bottom: "20px",
                right: "180px",
              }}
              disabled={empty}
              onClick={() => {
                setOnAdd(true);
              }}
            >
              <Tooltip title={t("Add")}>
                <AddIcon />
              </Tooltip>
            </Fab>
            <Fab
              color="primary"
              style={{
                position: "absolute",
                bottom: "20px",
                right: "100px",
              }}
              disabled={empty}
              onClick={() => {
                api
                  .Ignore({ file: currentImage })
                  .then(() => {
                    setSubmitted((x) =>
                      [
                        {
                          currentImage,
                          data: shapeDataRef.current,
                          type: "ignore",
                        },
                        ...x,
                      ].filter((_, i) => i < 50)
                    );
                    next();
                  })
                  .catch(setError);
              }}
            >
              <Tooltip title={t("Ignore")}>
                <ArrowForwardIcon />
              </Tooltip>
            </Fab>
            <Fab
              color="primary"
              style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
              }}
              disabled={empty}
              onClick={() => {
                const data = shapeDataRef.current.map(scaleDown);
                api
                  .Submit({ file: currentImage, data })
                  .then(() => {
                    setSubmitted((x) =>
                      [
                        {
                          currentImage,
                          data,
                          type: "submit",
                        },
                        ...x,
                      ].filter((_, i) => i < 50)
                    );
                    next();
                  })
                  .catch(setError);
              }}
            >
              <Tooltip title={t("Submit")}>
                <ArrowUpwardIcon />
              </Tooltip>
            </Fab>
          </div>
        </GridItem>
      </GridContainer>
    </div>
  );
}
