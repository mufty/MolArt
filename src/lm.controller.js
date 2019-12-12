/* eslint-disable indent,max-len */
const createPlugin = require('./lm.plugin.js');

require('../node_modules/semantic-ui-transition/transition.min');
require('../node_modules/semantic-ui-dropdown/dropdown.min');

require('./lib/semantic-ui-range/range');


function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function beautifyGroupName(name) {
    return capitalize(name).replace('_', ' ');
}

class PdbRecordMapping {
    constructor(){
        this.pdbRecord = undefined;
        this.modelId = undefined;
        this.selectionId = undefined;
        this.observedResidues = [];
        this.userHighlightVisualIds = [];
    }

    setPdbRecord(pdbRecord) {
        this.pdbRecord = pdbRecord;
    }

    getPdbRecord() {
        return this.pdbRecord;
    }

    setModelId(modelId) {
        this.modelId = modelId;
    }

    getModelId() {
        return this.modelId;
    }

    setSelectionId(selectionId) {
        this.selectionId = selectionId;
    }

    getSelectionId() {
        return this.selectionId;
    }

    setObservedResidues(observedResidues) {
        this.observedResidues= observedResidues;
    }

    getObservedResidues() {
        return this.observedResidues;
    }

    setUserHighlightVisualIds(userHighlightVisualIds) {
        this.userHighlightVisualIds= userHighlightVisualIds;
    }

    getUserHighlightVisualIds() {
        return this.userHighlightVisualIds;
    }
}

class LmController {
    
    constructor() {
        this.plugin = createPlugin();
        this.globals = {};
        this.mapping = {};
    }

    setToArray(set) {
        const array = [];

        set.forEach(v => array.push(v));
        return array;
    }

    uniquifyArray(arr) {
        const newArr = [];

        arr.forEach(v => {
            if (newArr.indexOf(v) === -1) newArr.push(v);
        });

        return newArr;
    }

    getPdbIds() {
        // return [...new Set(globals.pdbRecords.map(rec=>rec.getPdbId()))];
        // return Array.from(new Set(globals.pdbRecords.map(rec=>rec.getPdbId())));
        // return setToArray(new Set(globals.pdbRecords.map(rec=>rec.getPdbId())));
        return uniquifyArray(this.globals.pdbRecords.map(rec=>rec.getPdbId()));
    }

    getPdbChains(pdbId) {
        // return [... new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId()))];
        // return Array.from(new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId())));
        // return setToArray(new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId())));
        return uniquifyArray(this.globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId()));
    }

    /**
     * Fills dropdown with pdb chains to chains of currently selected pdb record and selects
     * the chain, which should be active or the first chain in the list.
     *
     * @param selectedFromActive If true, the selected item will be chosen based on active structure,
     * if not, it will be the first item in the list of chains. That is used in situations when the
     * user selects PDB ID from the dropdown and not from ProtVista.
     */
    updateHeaderChainIds(val, text, selected) {

        const pdbId = (val === undefined ? getHeaderPdbId() : val);
        const pdbChainList = getHeaderPdbChainList();
        const ddContent = getPdbChains(pdbId).map(val => { return {name: val, value: val};});

        if (ddContent.length === 0) return;// TODO: this should not happen
        /*if (!selectedFromActive)*/ ddContent[0].selected = true;

        pdbChainList.dropdown('change values', ddContent);

        /*if (selectedFromActive)*/ updateHeaderPdbChainToActive();

        // if (triggerChainListChange) pdbChainList.trigger('change');
    }

    populateHeaderPdbIds() {

        const pdbIdsList = getHeaderPdbIdList();
        // pdbIdsList.empty();
        // pdbIds.forEach(val => { pdbIdsList.append(`<option value="${val}">${val}</option>`); })
        const ddContent = getPdbIds().map(val => { return {name: val, value: val};});

        ddContent[0].selected = true;
        pdbIdsList.dropdown({
            values: ddContent,
            action: 'activate',
            // onChange: (val, text, selected) => { updateHeaderChainIds(val, text, selected); }
        });

        updateHeaderChainIds();
    }

    getHeaderPdbIdList() {
        return this.globals.container.find('.lm-pdb-id-list');
    }

    getHeaderPdbChainList() {
        return this.globals.container.find('.lm-pdb-chain-list');
    }

    getHeaderUserHighlightsList() {
        return this.globals.container.find('.user-highlights');
    }

    userHighlightSelected(i) {
        return $(getHeaderUserHighlightsList().find('div.item')[i]).hasClass('selected');
    }

    getHeaderPdbId() {
        //For some reason, using get value closes the combo
        return getHeaderPdbIdList().find('.text').text();
    }

    getHeaderChainId() {
        // return getHeaderPdbChainList().val();
        return getHeaderPdbChainList().dropdown('get value');
    }

    getHeaderLinkContainer() {
        return this.globals.container.find('.pv3d-header-lm .pdb-link');
    }

    deactivateDropdownsEvents() {
        getHeaderPdbIdList().dropdown('setting', 'onChange', function (value) {});
        getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {});
    }

    activateDropdownsEvents() {

        getHeaderPdbIdList().dropdown('setting', 'onChange', function (val, text, selected) {
            updateHeaderChainIds(val, text, selected);
        });

        getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {
            if (value) {
                updateActiveStructureFromHeader();
            }
        });

        // getHeaderUserHighlightsList().dropdown('setting', 'onChange', function (val, text, selected) {
        //     console.log(val, text, selected);
        //     updateUserSelection(val, text, selected);
        // });
    }

    updateHeader() {
        if (this.globals.activeStructure.pdbId === getHeaderPdbId() && globals.activeStructure.chainId === getHeaderChainId()) return;

        deactivateDropdownsEvents();
        if (getHeaderPdbId() !== this.globals.activeStructure.pdbId) {

            // pdbChainListOnChange(false);
            updateHeaderPdbIdToActive();
            updateHeaderChainIds();
            // pdbChainListOnChange(true);
        } else {

            updateHeaderChainIds();
        }
        activateDropdownsEvents();

        // updateHeaderPdbChainToActive();
    }

    updateHeaderPdbIdToActive() {
        // const list = getHeaderPdbIdList();
        // const opts = list.find('option').toArray().map(o => o.value);
        // list[0].selectedIndex = opts.indexOf(globals.activeStructure.pdbId);
        getHeaderPdbIdList().dropdown('set selected', this.globals.activeStructure.pdbId);
    }

    updateHeaderPdbChainToActive() {
        // const list = globals.container.find('.pv3d-header select.lm-pdb-chain-list');
        // const opts = list.find('option').toArray().map(o => o.value);
        getHeaderPdbChainList().dropdown('set selected', this.globals.activeStructure.chainId);

    }

    updateHeaderPdbLink() {
        const linkContainer = getHeaderLinkContainer();

        linkContainer.removeClass('pv3d-invisible');
        const source = this.globals.activeStructure.record.getSource();
        if (source === 'PDB'){
            linkContainer[0].childNodes[0].nodeValue = 'PDB: ';
            linkContainer.attr('href', getPdbLink(this.globals.activeStructure.pdbId));
            linkContainer.find('.detail').text(this.globals.activeStructure.pdbId);
        } else if (source === 'SMR') {
            linkContainer[0].childNodes[0].nodeValue = 'SMR: ';
            linkContainer.attr('href', getSmrLink(this.globals.uniprotId));
            linkContainer.find('.detail').text(`${this.globals.uniprotId} (${this.globals.activeStructure.pdbId})`);
        } else {
            throw Error('Unknown structure source');
        }
    }

    shiftActiveStructure(shift) {
        const pdbId = getHeaderPdbId();

        const pdbIdItems = getHeaderPdbIdList().find('.item');
        let currentIx;

        for (let ix = 0; ix < pdbIdItems.length; ix++) {
            if (this.globals.container.find(pdbIdItems[ix]).attr('data-value') === pdbId) {
                currentIx = ix;
                break;
            }
        }
        const newIx = currentIx + shift;

        if (newIx >= 0 && newIx < pdbIdItems.length) {
            const newPdbId = this.globals.container.find(pdbIdItems[newIx]).attr('data-value');

            this.globals.activeStructure.set(newPdbId, getPdbChains(newPdbId)[0]);
        }
    }

    pdbChainListOnChange(activate) {
        if (activate) {
            getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {
                if (value) {
                    updateActiveStructureFromHeader();
                }
            });
        } else {
            getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {});
        }
    }

    updateSurfaceTransparencyTitle(val){
        this.globals.container.find('.transparency-slider').attr('title', `Surface transparency:  ${val}%`)
    }

    handleEvents() {

        const initialTransparency = 15;
        this.globals.container.find('.transparency-slider').range({
            min: 0,
            max: 100,
            start: initialTransparency * 2, //for some reason the initial transparency got set to half of the required value
            onChange: function(val) {
                setSurfaceTransparency(parseFloat(val) / 100);
                updateSurfaceTransparencyTitle(val);
            }
        });
        setSurfaceTransparency(initialTransparency / 100);
        updateSurfaceTransparencyTitle(initialTransparency);

        activateDropdownsEvents();
        // pdbChainListOnChange(true);

        this.globals.container.find('.pv3d-header .shift-left').on('click', () => shiftActiveStructure(-1));
        this.globals.container.find('.pv3d-header .shift-right').on('click', () => shiftActiveStructure(1));
    }


    highlightCallBack(e) {
        if (e.data && e.data.residues.length > 0) {
            this.globals.pv.highlightActivePosition(e.data.residues[0].seqNumber);
        } else {
            this.globals.pv.dehighlightActivePosition();
        }
    }

    registerCallbacksAndEvents() {
        handleEvents();
        getPlugin().registerHighlightCallback(highlightCallBack);
    }

    updateActiveStructureFromHeader() {
        //TODO when loading the plugin, this is called multiple times which can cause the problems in getHeaderPdbId
        this.globals.activeStructure.set(getHeaderPdbId(), getHeaderChainId());
    }

    getPdbLink(pdbId) {
        return 'https://www.ebi.ac.uk/pdbe/entry/pdb/' + pdbId;
    }

    getSmrLink(uniprotId, pdbId) {
        return 'https://swissmodel.expasy.org/repository/uniprot/' + uniprotId;
    }

    rgbFromString(color) {
        const arr = color.split(/[(,)]/);
        return { r: arr[1], g: arr[2], b: arr[3] };
    }

    loadMolecule(rec, hideOthers) {

        return this.plugin.loadMolecule(rec.getPdbId(), rec.getSource(), rec.getCoordinatesFile()).then(function (modelId) {
            mapping[rec.getId()].setPdbRecord(rec);
            mapping[rec.getId()].setModelId(modelId);
            // load molecule into the LM plugin, retrieve ID of the respective model and hide all other models
            return hideOthers ? this.plugin.hideModelsExcept([modelId]) : Promise.resolve();
        });
    }

    createUniprotMappingGroup(rec) {
        return this.plugin.createGroup(this.globals.settings.pvMappedStructuresCat.name, 'Uniprot mapping', mapping[rec.getId()].getModelId());
    }

    createPdbSelections(rec, groupId) {
        // create selection corresponding to the PDB record and create visual for it
        const selectionName = rec.getPdbId().toUpperCase() + ':' + rec.getChainId() + ' (' + rec.getPdbStart() + '-' + rec.getPdbEnd() + ')';

        return this.plugin.createSelectionFromRange({
            rootId: groupId,
            name: selectionName,
            chainId: rec.getChainId(),
            beginIx: rec.getPdbStart(),
            endIx: rec.getPdbEnd(),
            selectionId: `${groupId}_${selectionName}` });
    }

    extractObservedResidues(rec){
        const modelId = mapping[rec.getId()].getModelId();
        const chainId = rec.getChainId();

        const isHets = this.plugin.getController().context.select(modelId)[0].props.model.data.residues.isHet;
        const seqNumbers  = this.plugin.getController().context.select(modelId)[0].props.model.data.residues.seqNumber;
        const asymIds  = this.plugin.getController().context.select(modelId)[0].props.model.data.residues.authAsymId;

        rec.setObservedResidues(seqNumbers.filter((seqNumber, ix) => asymIds[ix] === chainId && !isHets[ix]));
    }

    loadRecord(rec, params = {focus: true, hideOthers: true}) {

        const recId = rec.getId();

        if (recId in mapping) {
            if (params.focus) this.plugin.focusSelection(mapping[recId].getSelectionId());
            if (params.hideOthers) this.plugin.hideModelsExcept([mapping[recId].getModelId()]).then(()=>setUserSelectionsVisibiliy(mapping[recId].getPdbRecord().getPdbId()));
            const observedResidues = rec.getObservedResidues();
            if (!observedResidues || observedResidues.length === 0) extractObservedResidues(rec);
            updateHeaderPdbLink();

            return Promise.resolve();
        }

        mapping[recId] = new PdbRecordMapping();
        // mapping[recId] = {
        //     featureIdToSelId: {}
        // };

        let groupId, selectionId;
        let extraHighlightsContent = this.globals.opts.extraHighlights ? this.globals.opts.extraHighlights.content : [];

        return loadMolecule(rec, params.hideOthers)
            .then(() => {updateHeaderPdbLink(); return Promise.resolve();})
            .then(()=> {extractObservedResidues(rec); return Promise.resolve();})
            .then(() => createUniprotMappingGroup(rec))
            .then(_groupId => {
                groupId = _groupId;
                return createPdbSelections(rec, groupId)
            })
            .then(_selectionId => {

                selectionId = _selectionId;
                if (this.plugin.getEntity(selectionId).length == 0){
                  throw Error('Invalid mapping (the structure file does not contain the selection)');
                }

                mapping[recId].setSelectionId(selectionId);
                if (params.focus) this.plugin.focusSelection(selectionId);
                return this.plugin.createVisual(selectionId);
                // return createVisualForSelection(rec, selectionId);
                // focusAndColorPdb(rec, selectionId, color)
            }).then(() => {

                // Create group covering all selections possibly specified by the user

                return this.plugin.createGroup("Selections", 'Selections', selectionId)

            }).then((selectionsGroupId => {

                // Create selection for each of the selections
                const promises = extraHighlightsContent
                    .map((h, i) => {
                    const selName = h.sequenceNumbers.join();
                    return this.plugin.createSelectionFromList({
                        rootId: selectionsGroupId,
                        name: selName,
                        chainId: rec.getChainId(),
                        sequenceNumbers: h.sequenceNumbers.map(n=>rec.mapPosUnpToPdb(n)),
                        atomNames: h.atomNames,
                        selectionId: `user_selection_${selectionsGroupId}_sel${i}`
                    });
                });

                return Promise.all(promises);

            })).then(selectionsIds => {

                const promises = selectionsIds.map( (id, i) => {
                    if (id !== undefined) {
                        return this.plugin.createVisual(id,
                            params = {
                                style: this.plugin.getStyleDefinition(
                                    extraHighlightsContent[i].visual.type,
                                    extraHighlightsContent[i].visual.params,
                                    extraHighlightsContent[i].visual.color,
                                    extraHighlightsContent[i].visual.alpha

                                )}
                        )
                    } else {
                        return Promise.resolve(undefined);
                    }

                    });

                return Promise.all(promises);
            }).then(visualIds => {
                //console.log('visualIds',visualIds);
                const visualIdsDef = visualIds.filter(id => id !== undefined);
                mapping[recId].setUserHighlightVisualIds(visualIdsDef);
                visualIds.forEach((id, i) => {
                    if (id === undefined) return;
                     userHighlightSelected(i) || !this.globals.opts.extraHighlights.controlVisibility ? this.plugin.showEntity(id): this.plugin.hideEntity(id);
                    if (extraHighlightsContent[i].visualIds === undefined) extraHighlightsContent[i].visualIds = [];
                    extraHighlightsContent[i].visualIds.push(id)
                });
            });

    }

    mapFeatures(features, colors) {

        const modelIdSelections = {}; // mapping of features over all loaded chains

        for (const id in mapping) {
            const modelId = mapping[id].getModelId();

            if (!(modelId in modelIdSelections)) modelIdSelections[modelId] = [];

            if (!mapping[id].getPdbRecord()) continue; //can happen when there are problems when retrieving PDB records

            const rec = mapping[id].getPdbRecord();
            const chainId = rec.getChainId();
            const chainSelections = [];

            features.forEach((f, i) => {
                let  begin = rec.mapPosUnpToPdb(f.begin);
                let end = rec.mapPosUnpToPdb(f.end);
                const boundaryOnly = this.globals.settings.boundaryFeatureTypes.indexOf(f.type) >= 0; // whether only begin and end residues should be selected

                if ((boundaryOnly && (rec.isValidPdbPos(begin) || rec.isValidPdbPos(end))) ||
                    //(!boundaryOnly && rec.isValidPdbRegion(begin, end))
                    !boundaryOnly
                ) {
                    //Trim the selction to valid PDB region otherwise Litemol sometimes fail to color it
                    if (!boundaryOnly) {
                        const observedResidues = rec.getObservedResidues();
                        // begin = Math.max(begin, rec.getPdbStart(), observedResidues.length > 0 ? Math.min(...observedResidues) : 0);
                        // end = Math.min(end, rec.getPdbEnd(), observedResidues.length > 0 ? Math.max(...observedResidues) : 0);
                        rec.getObservedRanges().forEach(or => {
                            const seqStart = rec.mapPosStructToUnp(or.start.posStructure);
                            const seqEnd = rec.mapPosStructToUnp(or.end.posStructure);
                            if (f.end < seqStart || f.begin > seqEnd) {
                                return;
                            }
                            begin = Math.max(rec.mapPosUnpToPdb(Math.max(f.begin, seqStart)), 0);
                            end = Math.min(rec.mapPosUnpToPdb(Math.min(f.end, seqEnd)), rec.getPdbEnd());
                            modelIdSelections[modelId].push({ chainId: chainId, begin: begin, end: end, color: rgbFromString(colors[i]), boundaryOnly: boundaryOnly});
                        })
                    } else {
                        modelIdSelections[modelId].push({ chainId: chainId, begin: begin, end: end, color: rgbFromString(colors[i]), boundaryOnly: boundaryOnly});
                    }
                }
            });
            modelIdSelections[modelId] = modelIdSelections[modelId].concat(chainSelections);
        }

        Object.keys(modelIdSelections).forEach(modelId => this.plugin.colorSelections(modelId, modelIdSelections[modelId], "user_selection_"));
    }

    unmapFeature(feature) {
        plugin.resetVisuals("user_selection_");
    }


    setUserSelectionsVisibiliy(pdbId){

        // const recordVisuals = recMapping ? recMapping.getUserHighlightVisualIds() : undefined;
        let recordVisuals = [];
        for (const id in mapping) {
            if (mapping[id].getPdbRecord().getPdbId() === pdbId) {
                recordVisuals = recordVisuals.concat(mapping[id].getUserHighlightVisualIds());
            }
        }

        getHeaderUserHighlightsList().find('div.item').each(i => {
            this.globals.opts.extraHighlights.content[i].visualIds.forEach((visualId) => {
                if (recordVisuals === undefined || recordVisuals.indexOf(visualId) >= 0) {
                    userHighlightSelected(i) ? this.plugin.showEntity(visualId): this.plugin.hideEntity(visualId);
                }
            })
        })
    }

    highlightUserSelection(i, on, pdbId) {
        //i is the index of user selection in globals.opts.extraHighlights.content
        let recordVisuals = [];
        for (const id in mapping) {
            if (mapping[id].getPdbRecord().getPdbId() == pdbId) {
                recordVisuals = recordVisuals.concat(mapping[id].getUserHighlightVisualIds());
            }
        }

        this.globals.opts.extraHighlights.content[i].visualIds.forEach(visualId => {
            if (recordVisuals.indexOf(visualId) >= 0) {
                on ? this.plugin.showEntity(visualId) : this.plugin.hideEntity(visualId);
            }
        });

    }

    let lastHighlighted = -1;
    highlightResidue(resNum) {

        // The following test had to be commented out since when moving across categories the dehighlightAll is called and
        // then when entering another category at the same position, the active residue would remain dehighlighted

        // if (lastHighlighted === resNum) return;
        // lastHighlighted = resNum;

        dehighlightAll();
        for (const id in mapping) {
            if (mapping[id].getPdbRecord()) { // the structure might still be loading and pdbRecord might not have been added yet
                const pdbRec = mapping[id].getPdbRecord();

                if (pdbRec.isInObservedRanges(resNum)) {
                    this.plugin.highlightResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbRec.mapPosUnpToPdb(resNum));
                }

                // const pdbPos = pdbRec.mapPosUnpToPdb(resNum);
                //
                // if (pdbRec.isValidPdbPos(pdbPos)) {
                //     this.plugin.highlightResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbPos);
                // }
            }
        }
    }

    dehighlightAll() {
        this.plugin.dehighlightAll();
    }

    getPlugin() {
        return this.plugin;
    }

    moleculeLoaded() {
        return this.plugin.moleculeLoaded();
    }

    setSurfaceTransparency(val) {
        return this.plugin.setSurfaceTransparency(val, 'user_selection_');
    }

    showErrorMessage(message) {

        this.globals.lmErrorMessageContainer.find('.error-message')[0].innerHTML = message;
        this.globals.lmErrorMessageContainer.css('display', 'block');
    }

    hideErrorMessage() {
        this.globals.lmErrorMessageContainer.css('display', 'none');
    }

    initalizeUserHighlights() {
        let $userHighlihts = getHeaderUserHighlightsList();
        if (this.globals.opts.extraHighlights && this.globals.opts.extraHighlights.content.length > 0 && this.globals.opts.extraHighlights.controlVisibility) {

            const ddContent = [];
            this.globals.opts.extraHighlights.content.forEach((eh, i) => {
                ddContent.push({name: eh.label, value: i});
            });

            $userHighlihts.dropdown({
                placeholder: this.globals.opts.extraHighlights.label,
                values: ddContent,
                action: 'hide',
                onChange: (val, text, $selected) => {

                    if ($selected == undefined) return;

                    $selected.toggleClass('selected');
                    highlightUserSelection(val, $selected.hasClass('selected'), this.globals.activeStructure.pdbId);
                }
            });
            $userHighlihts.find('div.item').each((i, el) => {
                if (this.globals.opts.extraHighlights.content[i].showOnStart) {
                    $(el).addClass('selected');
                }
            })
            $userHighlihts.find('div.text').removeClass('default');
        } else {
            $userHighlihts.css('display', 'none');
        }
    }


    getAuthSeqNumber(rec, resNum) {
        // returns https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.core.structure.residue.html
        let modelId = mapping[rec.getId()].getModelId();
        return this.plugin.getAuthSeqNumber(modelId, rec.getChainId(), resNum);
    }

    getAuthSeqNumberRange(rec, resNumBegin, resNumEnd) {
        let modelId = mapping[rec.getId()].getModelId();
        return this.plugin.getAuthSeqNumberRange(modelId, rec.getChainId(), resNumBegin, resNumEnd);

    }

    initialize(params) {
        this.globals = params.globals;
        this.plugin.initializePlugin(this.globals.lmContainerId);

        initalizeUserHighlights();

        if ('pdbRecords' in this.globals) populateHeaderPdbIds();
        registerCallbacksAndEvents();
    }

    destroy(){
        this.plugin.destroyPlugin();
    }
    
}

module.exports = LmController;
