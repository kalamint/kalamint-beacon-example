import React from "react";

export class Section extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="Card">
        <p>{this.props.name}</p> <hr />
        <div className="card-content">{this.props.children}</div>
      </div>
    );
  }
}