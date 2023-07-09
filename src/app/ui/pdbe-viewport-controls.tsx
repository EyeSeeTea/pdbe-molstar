import { PluginConfig } from "Molstar/mol-plugin/config";
import { ControlGroup } from "Molstar/mol-plugin-ui/controls/common";
import { ToggleSelectionModeButton } from "Molstar/mol-plugin-ui/structure/selection";
import { DownloadScreenshotControls } from "./pdbe-screenshot-controls";
import { SimpleSettingsControl } from "Molstar/mol-plugin-ui/viewport/simple-settings";
import { ViewportControls } from "Molstar/mol-plugin-ui/viewport";
import {
    AutorenewSvg,
    CameraOutlinedSvg,
    BuildOutlinedSvg,
    FullscreenSvg,
    TuneSvg,
    CloseSvg,
    BlurOnSvg,
} from "Molstar/mol-plugin-ui/controls/icons";
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import {
    VolumeStreamingControls,
    VolumeSourceControls,
} from "molstar/lib/mol-plugin-ui/structure/volume";

/* We need to add stateful components to PDBeViewportControls, but we cannot extend ViewportControls
   with new props/state as ViewportControls is not generic. As a workaround, use a custom extended
   state and perform casting when necessary. */

type ViewportControlsState = ViewportControls extends PluginUIComponent<
    any,
    infer State
>
    ? State
    : never;

interface ControlsExtendedState extends ViewportControlsState {
    isVolumeExpanded: boolean;
}

type ExtendedSetState = (
    cb: (prevState: ControlsExtendedState) => Partial<ControlsExtendedState>
) => void;

export class PDBeViewportControls extends ViewportControls {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ...this.state,
            isVolumeExpanded: false,
        } as ViewportControlsState;
    }

    toggleVolumeExpanded = () => {
        (this.setState as ExtendedSetState)((prevState) => {
            return { isVolumeExpanded: !prevState.isVolumeExpanded };
        });
    };

    isBlack(customeState: any): boolean {
        if (
            customeState &&
            customeState.initParams &&
            customeState.initParams.bgColor
        ) {
            const color = customeState.initParams.bgColor;
            if (color.r === 0 && color.g === 0 && color.b === 0) return true;
        }
        return false;
    }

    render() {
        const isVolumeExpanded = (this.state as ControlsExtendedState)
            .isVolumeExpanded;
        const customeState: any = this.plugin.customState;
        let showControlToggle = true;
        let showControlInfo = true;
        if (
            customeState &&
            customeState.initParams &&
            customeState.initParams.hideCanvasControls &&
            customeState.initParams.hideCanvasControls.indexOf(
                "controlToggle"
            ) > -1
        )
            showControlToggle = false;
        if (
            customeState &&
            customeState.initParams &&
            customeState.initParams.hideCanvasControls &&
            customeState.initParams.hideCanvasControls.indexOf("controlInfo") >
                -1
        )
            showControlInfo = false;

        return (
            <div
                className="msp-viewport-controls"
                onMouseMove={this.onMouseMove}
            >
                <div className="msp-viewport-controls-buttons">
                    <div className="msp-pdbe-control-reset-camera">
                        <div className="msp-semi-transparent-background" />
                        {this.icon(
                            AutorenewSvg,
                            this.resetCamera,
                            "Reset Camera"
                        )}
                    </div>
                    <div className="msp-pdbe-control-snapshot">
                        <div className="msp-semi-transparent-background" />
                        {this.icon(
                            CameraOutlinedSvg,
                            this.toggleScreenshotExpanded,
                            "Screenshot / State Snapshot",
                            this.state.isScreenshotExpanded
                        )}
                    </div>
                    <div>
                        <div className="msp-semi-transparent-background" />
                        <div className="msp-pdbe-control-toggle-controls-panel">
                            {showControlToggle &&
                                this.icon(
                                    BuildOutlinedSvg,
                                    this.toggleControls,
                                    "Toggle Controls Panel",
                                    this.plugin.layout.state.showControls
                                )}
                        </div>
                        {this.plugin.config.get(
                            PluginConfig.Viewport.ShowExpand
                        ) && (
                            <div className="msp-pdbe-control-toggle-expanded-viewport">
                                {this.icon(
                                    FullscreenSvg,
                                    this.toggleExpanded,
                                    "Toggle Expanded Viewport",
                                    this.plugin.layout.state.isExpanded
                                )}
                            </div>
                        )}

                        <div className="msp-pdbe-control-settings">
                            {showControlInfo &&
                                this.icon(
                                    TuneSvg,
                                    this.toggleSettingsExpanded,
                                    "Settings / Controls Info",
                                    this.state.isSettingsExpanded
                                )}
                        </div>
                    </div>
                    {this.plugin.config.get(
                        PluginConfig.Viewport.ShowSelectionMode
                    ) && (
                        <div>
                            <div className="msp-semi-transparent-background" />
                            <div className="msp-pdbe-control-toggle-selection-mode">
                                <ToggleSelectionModeButton />
                            </div>
                        </div>
                    )}

                    <div className="msp-pdbe-control-volume">
                        <div className="msp-semi-transparent-background" />
                        {this.icon(
                            BlurOnSvg,
                            this.toggleVolumeExpanded,
                            "Volume",
                            isVolumeExpanded
                        )}
                    </div>
                </div>

                {this.state.isScreenshotExpanded && (
                    <div className="msp-viewport-controls-panel">
                        <ControlGroup
                            header="Screenshot / State"
                            title="Click to close."
                            initialExpanded={true}
                            hideExpander={true}
                            hideOffset={true}
                            onHeaderClick={this.toggleScreenshotExpanded}
                            topRightIcon={CloseSvg}
                            noTopMargin
                            childrenClassName="msp-viewport-controls-panel-controls"
                        >
                            <DownloadScreenshotControls
                                close={this.toggleScreenshotExpanded}
                            />
                        </ControlGroup>
                    </div>
                )}

                {this.state.isSettingsExpanded && (
                    <div className="msp-viewport-controls-panel">
                        <ControlGroup
                            header="Settings / Controls Info"
                            title="Click to close."
                            initialExpanded={true}
                            hideExpander={true}
                            hideOffset={true}
                            onHeaderClick={this.toggleSettingsExpanded}
                            topRightIcon={CloseSvg}
                            noTopMargin
                            childrenClassName="msp-viewport-controls-panel-controls"
                        >
                            <SimpleSettingsControl />
                        </ControlGroup>
                    </div>
                )}

                {isVolumeExpanded && (
                    <div className="msp-viewport-controls-panel">
                        <ControlGroup
                            header="Volume"
                            title="Click to close."
                            initialExpanded={true}
                            hideExpander={true}
                            hideOffset={true}
                            onHeaderClick={this.toggleVolumeExpanded}
                            topRightIcon={CloseSvg}
                            noTopMargin
                            childrenClassName="msp-viewport-controls-panel-controls"
                        >
                            <VolumeStreamingControls />
                            <VolumeSourceControls />
                        </ControlGroup>
                    </div>
                )}
            </div>
        );
    }
}
