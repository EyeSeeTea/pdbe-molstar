import React from "react";
import { SequenceView } from "./sequence";

export function initSequenceView(chainSelected: string) {
    return {
      component: class extends React.Component<{}> {
        render() {
          return <SequenceView {...this.props} chainSelected={chainSelected}/>;
        }
      },
    };
  }