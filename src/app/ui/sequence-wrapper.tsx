import React from "react";
import { SequenceView } from "./sequence";
import { PDBeMolstarPlugin } from "..";

export function initSequenceView(plugin: PDBeMolstarPlugin, onChainUpdate?: (chainId: string) => void) {
    return {
      component: class extends React.Component<{}> {
        render() {
          return <SequenceView {...this.props} plugin={plugin} onChainUpdate={onChainUpdate}/>;
        }
      },
    };
  }