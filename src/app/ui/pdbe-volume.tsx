/**
 * Copyright (c) 2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import * as React from "react";
import { VolumeRepresentationRef } from "molstar/lib/mol-plugin-state/manager/volume/hierarchy-state";
import { State, StateSelection } from "molstar/lib/mol-state";
import { PurePluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import { ActionMenu } from "molstar/lib/mol-plugin-ui/controls/action-menu";
import { Button, ControlRow } from "molstar/lib/mol-plugin-ui/controls/common";
import { UpdateTransformControl } from "molstar/lib/mol-plugin-ui/state/update-transform";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Slider } from "molstar/lib/mol-plugin-ui/controls/slider";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { VolumeSourceControls } from "molstar/lib/mol-plugin-ui/structure/volume";

/* Custom volume button with EMDB url, base code from mol-plugin-ui/structure/volume.tsx */

export class VolumeSourceCustomControls extends VolumeSourceControls {
    renderControls() {
        const disabled = this.state.isBusy || this.isEmpty;
        const label = this.label;
        const selected = this.plugin.managers.volume.hierarchy.selection;

        return (
            <>
                <div className="msp-flex-row" style={{ marginTop: "1px" }}>
                    <Button noOverflow flex onClick={this.toggleHierarchy} disabled={disabled} title={label}>
                        {label}
                    </Button>
                </div>

                {this.state.show === "hierarchy" && (
                    <ActionMenu items={this.hierarchyItems} onSelect={this.selectCurrent} />
                )}

                {this.state.show === "add-repr" && <ActionMenu items={this.addActions} onSelect={this.selectAdd} />}

                {selected && selected.representations.length > 0 && (
                    <div style={{ marginTop: "6px" }}>
                        {selected.representations.map((r) => (
                            <VolumeRepresentationCustomControls key={r.cell.transform.ref} representation={r} />
                        ))}
                    </div>
                )}
            </>
        );
    }
}

/* Custom PDBe volume controls:

    - Assume format 'dscif', binary.
    - Assume volume URL contains detail=N
*/

const config = {
    detail: { min: 0, max: 6, default: 3 },
};

class VolumeRepresentationCustomControls extends PurePluginUIComponent<
    { representation: VolumeRepresentationRef },
    { detail: number }
> {
    state = { action: undefined, detail: config.detail.default };

    componentDidMount() {
        const { detail } = this.getInfo();

        if (detail) this.setState({ detail });

        this.subscribe(this.plugin.state.events.cell.stateUpdated, (e) => {
            if (State.ObjectEvent.isCell(e, this.props.representation.cell)) this.forceUpdate();
        });
    }

    remove = () => {
        return this.plugin.managers.volume.hierarchy.remove([this.props.representation], true);
    };

    toggleVisible = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.currentTarget.blur();
        this.plugin.managers.volume.hierarchy.toggleVisibility([this.props.representation]);
    };

    highlight = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        if (!this.props.representation.cell.parent) return;
        PluginCommands.Interactivity.Object.Highlight(this.plugin, {
            state: this.props.representation.cell.parent!,
            ref: this.props.representation.cell.transform.ref,
        });
    };

    clearHighlight = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        PluginCommands.Interactivity.ClearHighlights(this.plugin);
    };

    focus = () => {
        const repr = this.props.representation;
        const objects = this.props.representation.cell.obj?.data.repr.renderObjects;
        if (repr.cell.state.isHidden)
            this.plugin.managers.volume.hierarchy.toggleVisibility([this.props.representation], "show");
        this.plugin.managers.camera.focusRenderObjects(objects, { extraRadius: 1 });
    };

    getInfo = () => {
        const state = this.plugin.state.data;
        const sourceRef = this.props.representation.cell.sourceRef;
        const base = {
            dataCell: undefined,
            url: undefined,
            detail: undefined,
            emdbId: undefined,
        };
        if (!sourceRef) return base;

        const dataCell = StateSelection.findAncestorOfType(state.tree, state.cells, sourceRef, [
            PluginStateObject.Data.Binary,
        ]);

        const url: string | undefined = dataCell?.params?.values?.url;

        if (!dataCell) {
            console.error("Cannot find data node for volume");
            return base;
        } else if (!url) {
            console.error("Cannot get URL for volume");
            return { ...base, url: undefined };
        } else {
            const detailStr = url.match(/detail=(\d+)/)?.[1];
            const detailN = detailStr ? parseInt(detailStr) : NaN;
            const detail = !Number.isNaN(detailN) ? detailN : undefined;
            const emdbId = url.match(/emd-\d+/i)?.[0]?.toUpperCase();
            return { dataCell, url, detail, emdbId };
        }
    };

    setDetail = async (detail: number) => {
        const { url, dataCell } = this.getInfo();
        if (!dataCell || !url) return;

        this.setState({ detail });

        const newUrl = url.replace(/detail=\d+/, `detail=${detail}`);
        const params = { url: newUrl, isBinary: true, format: "dscif" };
        const { state } = this.plugin;
        await state.updateTransform(state.data, dataCell.transform.ref, params);
    };

    render() {
        const repr = this.props.representation.cell;

        return (
            <>
                <ControlRow
                    label="Detail"
                    control={
                        <div style={{ display: "flex", textAlignLast: "center" }}>
                            <Slider
                                value={this.state.detail}
                                min={config.detail.min}
                                max={config.detail.max}
                                step={1}
                                onChange={this.setDetail}
                            />
                        </div>
                    }
                />

                <div className="msp-flex-row">
                    <Button
                        noOverflow
                        className="msp-control-button-label"
                        title={`${repr.obj?.label}. Click to focus.`}
                        onClick={this.focus}
                        onMouseEnter={this.highlight}
                        onMouseLeave={this.clearHighlight}
                        style={{ textAlign: "left" }}
                    >
                        {repr.obj?.label}
                        <small className="msp-25-lower-contrast-text" style={{ float: "right" }}>
                            {repr.obj?.description}
                        </small>
                    </Button>
                </div>

                {repr.parent && (
                    <div style={{ marginBottom: "6px" }} className="msp-accent-offset">
                        <UpdateTransformControl
                            state={repr.parent}
                            transform={repr.transform}
                            customHeader="none"
                            noMargin
                        />
                    </div>
                )}
            </>
        );
    }
}
