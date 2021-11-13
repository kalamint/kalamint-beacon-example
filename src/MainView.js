import React from "react";

import { ConnectSection } from "./components/ConnectSection";
import { PurchaseSection } from "./components/PurchaseSection";
import { ViewSection } from "./components/ViewSection";
import { MintSection } from "./components/MintSection";

class MainView extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="MainView">
        <ConnectSection />
        <ViewSection />
        <PurchaseSection />
        <MintSection />
      </div>
    );
  }
}

export default MainView;
