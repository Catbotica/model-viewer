import React from 'react';
import { Panel, Container, TreeViewItem, TreeView } from '@playcanvas/pcui/react';
import { Morph, HierarchyNode, SetProperty, ObserverData } from '../../types';

import { Vector, Detail, Select, MorphSlider } from '../components';

const toggleCollapsed = () => {
    document.getElementById('panel-left').classList.toggle('collapsed');
    if (window.observer as any) (window.observer as any).emit('canvasResized');
};

class ScenePanel extends React.Component <{ sceneData: ObserverData['scene'], setProperty: SetProperty }> {
    shouldComponentUpdate(nextProps: Readonly<{ sceneData: ObserverData['scene']; setProperty: SetProperty; }>): boolean {
        return (
            nextProps.sceneData.loadTime !== this.props.sceneData.loadTime ||
            nextProps.sceneData.meshCount !== this.props.sceneData.meshCount ||
            nextProps.sceneData.vertexCount !== this.props.sceneData.vertexCount ||
            nextProps.sceneData.primitiveCount !== this.props.sceneData.primitiveCount ||
            nextProps.sceneData.bounds !== this.props.sceneData.bounds ||
            nextProps.sceneData.variant.selected !== this.props.sceneData.variant.selected ||
            nextProps.sceneData.variants.list !== this.props.sceneData.variants.list
        );
    }

    render() {
        const scene = this.props.sceneData;
        const variantListOptions: Array<{ v:string, t:string }> = JSON.parse(scene.variants.list).map((variant: string) => ({ v: variant, t: variant }));
        return (
            <Panel headerText='SCENE' id='scene-panel' flexShrink={0} flexGrow={0} collapsible >
                <Detail label='Load time' value={scene.loadTime} />
                <Detail label='Meshes' value={scene.meshCount} />
                <Detail label='Verts' value={scene.vertexCount} />
                <Detail label='Primitives' value={scene.primitiveCount} />
                <Vector label='Bounds' dimensions={3} value={scene.bounds} enabled={false}/>
                <Select label='Variant' type='string' options={variantListOptions} value={scene.variant.selected}
                    setProperty={(value: string) => {
                        this.props.setProperty('scene.variant.selected', value);
                    }}
                    enabled={ variantListOptions.length > 0 }
                />
            </Panel>
        );
    }
}

class HierarchyPanel extends React.Component <{ sceneData: ObserverData['scene'], setProperty: SetProperty }> {
    shouldComponentUpdate(nextProps: Readonly<{ sceneData: ObserverData['scene']; setProperty: SetProperty; }>): boolean {
        return (
            nextProps.sceneData.nodes !== this.props.sceneData.nodes
        );
    }

    render() {
        const scene = this.props.sceneData;
        const modelHierarchy: Array<HierarchyNode> = JSON.parse(scene.nodes);
        const mapNodes = (nodes: Array<HierarchyNode>) => {
            return nodes.map((node:HierarchyNode) => <TreeViewItem text={`${node.name}`} key={node.path}
                onSelect={() => this.props.setProperty('scene.selectedNode.path', node.path)}
                onDeselect={() => this.props.setProperty('scene.selectedNode.path', '')}
            >
                { mapNodes(node.children) }
            </TreeViewItem>);
        };
        return (
            <Panel headerText='HIERARCHY' class='scene-hierarchy-panel' enabled={modelHierarchy.length > 0} collapsible>
                { modelHierarchy.length > 0 &&
                    <TreeView allowReordering={false} allowDrag={false}>
                        { mapNodes(modelHierarchy) }
                    </TreeView>
                }
            </Panel>
        );
    }
}

class MorphTargetPanel extends React.Component <{ morphTargetData: ObserverData['morphTargets'], progress: number, setProperty: SetProperty }> {
    shouldComponentUpdate(nextProps: Readonly<{ morphTargetData: ObserverData['morphTargets']; progress: number; setProperty: SetProperty; }>): boolean {
        return (
            JSON.stringify(nextProps.morphTargetData) !== JSON.stringify(this.props.morphTargetData) || nextProps.progress !== this.props.progress
        );
    }

    render() {
        const morphTargets: Record<string, {name: string, morphs: Record<string, Morph>}> = this.props.morphTargetData;
        return morphTargets ? (
            <Panel headerText='MORPH TARGETS' class='scene-morph-panel' collapsible>
                {Object.keys(morphTargets).map((key) => {
                    const panel = morphTargets[key];
                    return (
                        <Panel key={`${key}.${panel.name}`} headerText={panel.name} collapsible class='morph-target-panel'>
                            {Object.keys(panel.morphs).map((morphKey) => {
                                const morph: Morph = panel.morphs[morphKey];
                                return <MorphSlider key={`${key}.${morphKey}`} name={`${morph.name}`} precision={2} min={0} max={1}
                                    value={morphTargets[key].morphs[morph.targetIndex].weight}
                                    setProperty={(value: number) => this.props.setProperty(`morphTargets.${key}.morphs.${morph.targetIndex}.weight`, value)}
                                />;
                            })}
                        </Panel>
                    );
                })}
            </Panel>
        ) : null;
    }
}

class LeftPanel extends React.Component <{ observerData: ObserverData, setProperty: SetProperty }> {
    shouldComponentUpdate(nextProps: Readonly<{ observerData: ObserverData; setProperty: SetProperty; }>): boolean {
        return JSON.stringify(nextProps.observerData.scene) !== JSON.stringify(this.props.observerData.scene);
    }

    componentDidMount(): void {
        // set up the control panel toggle button
        const panelToggleDiv = document.getElementById('panel-toggle');
        panelToggleDiv.addEventListener('click', function () {
            toggleCollapsed();
        });
        if (document.body.clientWidth <= 600) {
            toggleCollapsed();
        }
    }

    render() {
        const scene = this.props.observerData.scene;
        const morphTargets = this.props.observerData.morphTargets;
        return (
            <Container id='scene-container' flex>
                <ScenePanel sceneData={scene} setProperty={this.props.setProperty} />
                <div id='scene-scrolly-bits'>
                    <HierarchyPanel sceneData={scene} setProperty={this.props.setProperty} />
                    <MorphTargetPanel progress={this.props.observerData.animation.progress} morphTargetData={morphTargets} setProperty={this.props.setProperty} />
                </div>
            </Container>
        );
    }
}

export default LeftPanel;
