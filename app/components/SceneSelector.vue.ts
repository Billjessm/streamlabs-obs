import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import Selector from './Selector.vue';
import { ScenesService } from '../services/scenes';
import { Menu } from '../util/menus/Menu';
import { ScenesTransitionsService } from '../services/scenes-transitions';
import { SceneCollectionsService } from '../services/scene-collections';
import { AppService } from '../services/app';
import DropdownMenu from './shared/DropdownMenu.vue';
import HelpTip from './shared/HelpTip.vue';
import { EDismissable } from 'services/dismissables';

@Component({
  components: { Selector, DropdownMenu, HelpTip },
})
export default class SceneSelector extends Vue {
  @Inject() scenesService: ScenesService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() appService: AppService;
  @Inject() scenesTransitionsService: ScenesTransitionsService;

  showContextMenu() {
    const menu = new Menu();
    menu.append({
      label: 'Duplicate',
      click: () => this.scenesService.showDuplicateScene(this.scenesService.activeScene.name)
    });
    menu.append({
      label: 'Rename',
      click: () => this.scenesService.showNameScene(this.scenesService.activeScene.name)
    });
    menu.append({
      label: 'Remove',
      click: () => this.scenesService.removeScene(this.scenesService.activeScene.id)
    });
    menu.popup();
    menu.destroy();
  }

  makeActive(id: string) {
    this.scenesService.makeSceneActive(id);
  }

  handleSort(data: any) {
    this.scenesService.setSceneOrder(data.order);
  }

  addScene() {
    this.scenesService.showNameScene();
  }

  removeScene() {
    this.scenesService.removeScene(this.activeSceneId);
  }

  showTransitions() {
    this.scenesTransitionsService.showSceneTransitions();
  }

  get scenes() {
    return this.scenesService.scenes.map(scene => {
      return {
        name: scene.name,
        value: scene.id
      };
    });
  }

  get sceneCollections() {
    return this.sceneCollectionsService.collections;
  }

  get activeId() {
    return this.sceneCollectionsService.activeCollection.id;
  }

  get activeCollection() {
    return this.sceneCollectionsService.activeCollection;
  }

  get activeSceneId() {
    if (this.scenesService.activeScene) {
      return this.scenesService.activeScene.id;
    }

    return null;
  }

  loadCollection(id: string) {
    this.sceneCollectionsService.load(id);
  }

  addCollection() {
    this.sceneCollectionsService.showNameConfig();
  }


  duplicateCollection() {
    this.sceneCollectionsService.showNameConfig({
      sceneCollectionToDuplicate: this.activeCollection.id
    });
  }


  renameCollection() {
    this.sceneCollectionsService.showNameConfig({ rename: true });
  }


  removeCollection() {
    if (!confirm(`remove ${this.activeCollection.name} ?`)) return;
    this.sceneCollectionsService.delete();
  }

  get helpTipDismissable() {
    return EDismissable.SceneCollectionsHelpTip;
  }
}
