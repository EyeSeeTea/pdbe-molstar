export function subscribeToComponentEvents(wrapperCtx: any) {
    document.addEventListener('PDB.interactions.click', function(e: any){
        if(typeof e.detail !== 'undefined'){
            const data = e.detail.interacting_nodes ? { data: e.detail.interacting_nodes } : { data: [e.detail.selected_node] };
            data.data[0]['focus'] = true;
            wrapperCtx.visual.select(data);
        }
    });

    document.addEventListener('PDB.interactions.mouseover', function(e: any){
        if(typeof e.detail !== 'undefined'){
            const data = e.detail.interacting_nodes ? { data: e.detail.interacting_nodes } : { data: [e.detail.selected_node] };
            wrapperCtx.visual.highlight(data);
        }
    });

    document.addEventListener('PDB.interactions.mouseout', function(e: any){
        wrapperCtx.visual.clearHighlight();
    });

    document.addEventListener('PDB.topologyViewer.click', function(e: any){
        if(typeof e.eventData !== 'undefined'){
            // Create query object from event data
            let highlightQuery = {
                entity_id: e.eventData.entityId,
                struct_asym_id: e.eventData.structAsymId,
                start_residue_number: e.eventData.residueNumber,
                end_residue_number: e.eventData.residueNumber,
                sideChain: true,
                focus: true
            };
            // Call highlightAnnotation
            wrapperCtx.visual.select({data: [highlightQuery]});
        }
    });

    document.addEventListener('PDB.topologyViewer.mouseover', function(e: any){
        if(typeof e.eventData !== 'undefined'){
            // Abort if entryid do not match or viewer type is unipdb
            // if(e.eventData.entryId != scope.pdbId) return;

            // Create query object from event data
            let highlightQuery = {
                entity_id: e.eventData.entityId,
                struct_asym_id: e.eventData.structAsymId,
                start_residue_number: e.eventData.residueNumber,
                end_residue_number: e.eventData.residueNumber
            };
            // Call highlightAnnotation
            wrapperCtx.visual.highlight({data: [highlightQuery]});
        }
    });

    document.addEventListener('PDB.topologyViewer.mouseout', function(e: any){
        wrapperCtx.visual.clearHighlight();
    });

    document.addEventListener('protvista-mouseover', function(ev: any){
        if(typeof ev.detail !== 'undefined'){
            let highlightQueries: any[] = [];

            const fragments = ev.detail.type === "collection" ? ev.detail.fragments : [ev.detail];

            fragments.forEach((fragment: any) => {
                let highlightQuery: any = undefined;

                // Create query object from event data
                if(fragment.start && fragment.end){
                    highlightQuery = {
                        start_residue_number: parseInt(fragment.start),
                        end_residue_number: parseInt(fragment.end)
                    };
                }

                if(fragment.feature && fragment.feature.entityId) highlightQuery['entity_id'] = fragment.feature.entityId + '';
                if(fragment.feature && fragment.feature.bestChainId) highlightQuery['struct_asym_id'] = fragment.feature.bestChainId;

                if(highlightQuery) highlightQueries.push(highlightQuery);
            });

            if (highlightQueries.length > 0) {
                wrapperCtx.visual.highlight({data: highlightQueries});
            } else {
                wrapperCtx.visual.clearHighlight();
            }
        }
    });

    document.addEventListener('protvista-mouseout', function(e: any){
        wrapperCtx.visual.clearHighlight();
    });

    document.addEventListener('protvista-click', function(e: any){
        if(typeof e.detail !== 'undefined'){

            let showInteraction = false;
            let highlightQuery: any = undefined;

            // Create query object from event data
            if(e.detail.start && e.detail.end){
                highlightQuery = {
                    start_residue_number: parseInt(e.detail.start),
                    end_residue_number: parseInt(e.detail.end)
                };
            }

            if(e.detail.feature && e.detail.feature.entityId) highlightQuery['entity_id'] = e.detail.feature.entityId + '';
            if(e.detail.feature && e.detail.feature.bestChainId) highlightQuery['struct_asym_id'] = e.detail.feature.bestChainId;

            if(e.detail.feature && e.detail.feature.accession && e.detail.feature.accession.split(' ')[0] === 'Chain' || e.detail.feature.tooltipContent === 'Ligand binding site') {
                showInteraction = true;
            }

            if(e.detail.start === e.detail.end) showInteraction = true;

            if(highlightQuery){

                if(showInteraction){
                    highlightQuery['sideChain'] = true;
                }else{
                    let selColor = undefined;
                    if(e.detail.trackIndex > -1 && e.detail.feature.locations && e.detail.feature.locations[0].fragments[e.detail.trackIndex].color) selColor = e.detail.feature.locations[0].fragments[e.detail.trackIndex].color;
                    if(typeof selColor == 'undefined' && e.detail.feature.color) selColor = e.detail.feature.color;
                    if(typeof selColor == 'undefined' && e.detail.color) selColor = e.detail.color;

                    if(typeof selColor == 'undefined'){
                        selColor = {r:65, g:96, b:91};
                    }else{
                        let isRgb = /rgb/g;
                        if(isRgb.test(selColor)){
                            let rgbArr = selColor.substring(4, selColor.length - 1).split(',');
                            selColor = {r:rgbArr[0], g:rgbArr[1], b:rgbArr[2]};
                        }
                    }

                    highlightQuery['color'] = selColor;
                }
                highlightQuery['focus'] = true;
                wrapperCtx.visual.select({data: [highlightQuery]});
            }
        }
    });

    const elementTypeArrForRange = ['uniprot', 'pfam', 'cath', 'scop', 'strand', 'helice'];
    const elementTypeArrForSingle = ['chain', 'quality', 'quality_outlier', 'binding site', 'alternate conformer'];
    document.addEventListener('PDB.seqViewer.click', function(e: any){
        if(typeof e.eventData !== 'undefined'){
            // Abort if entryid and entityid do not match or viewer type is unipdb
            // if(e.eventData.entryId != scope.pdbId) return;

            if(typeof e.eventData.elementData !== 'undefined' && elementTypeArrForSingle.indexOf(e.eventData.elementData.elementType) > -1){
                // Create query object from event data
                const highlightQuery = {
                    entity_id: e.eventData.entityId,
                    struct_asym_id: e.eventData.elementData.pathData.struct_asym_id,
                    start_residue_number: e.eventData.residueNumber,
                    end_residue_number: e.eventData.residueNumber,
                    sideChain: true,
                    focus: true
                };

                // Call highlightAnnotation
                wrapperCtx.visual.select({data: [highlightQuery]});

            }else if(typeof e.eventData.elementData !== 'undefined' && elementTypeArrForRange.indexOf(e.eventData.elementData.elementType) > -1){

                const seqColorArray =  e.eventData.elementData.color;

                // Create query object from event data
                const highlightQuery = {
                    entity_id: e.eventData.entityId,
                    struct_asym_id: e.eventData.elementData.pathData.struct_asym_id,
                    start_residue_number: e.eventData.elementData.pathData.start.residue_number,
                    end_residue_number: e.eventData.elementData.pathData.end.residue_number,
                    color: {r: seqColorArray[0], g: seqColorArray[1], b: seqColorArray[2]},
                    focus: true
                };
                wrapperCtx.visual.select({data: [highlightQuery]});
            }

        }
    });

    document.addEventListener('PDB.seqViewer.mouseover', function(e: any){
        if(typeof e.eventData !== 'undefined'){
            // Abort if entryid and entityid do not match or viewer type is unipdb
            // if(e.eventData.entryId != scope.pdbId) return;

            if(typeof e.eventData.elementData !== 'undefined' && elementTypeArrForSingle.indexOf(e.eventData.elementData.elementType) > -1){
                // Create query object from event data
                let highlightQuery = {
                    entity_id: e.eventData.entityId,
                    struct_asym_id: e.eventData.elementData.pathData.struct_asym_id,
                    start_residue_number: e.eventData.residueNumber,
                    end_residue_number: e.eventData.residueNumber,
                    focus: true
                };
                wrapperCtx.visual.select({data: [highlightQuery]});

            }else if(typeof e.eventData.elementData !== 'undefined' && elementTypeArrForRange.indexOf(e.eventData.elementData.elementType) > -1){

                // Create query object from event data
                let highlightQuery = {
                    entity_id: e.eventData.entityId,
                    struct_asym_id: e.eventData.elementData.pathData.struct_asym_id,
                    start_residue_number: e.eventData.elementData.pathData.start.residue_number,
                    end_residue_number: e.eventData.elementData.pathData.end.residue_number
                };
                // Call highlightAnnotation
                wrapperCtx.visual.highlight({data: [highlightQuery]});
            }
        }
    });

    document.addEventListener('PDB.seqViewer.mouseout', function(e){
        wrapperCtx.visual.clearHighlight();
    });
}
