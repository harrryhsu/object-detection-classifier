import React from "react";
import GridContainer from "components/Grid/GridContainer.js";
import Drawer from "./Drawer";
import CardBody from "components/Card/CardBody";
import Card from "components/Card/Card";

const Traffic = (props) => {
  const { id, ...rest } = props;
  return (
    <Card>
      <CardBody>
        <GridContainer style={{ marginTop: "-40px" }}>
          <Drawer id={id} {...rest} />
        </GridContainer>
      </CardBody>
    </Card>
  );
};

export default Traffic;
