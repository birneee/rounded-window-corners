import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {_log} from '../../utils/log.js';
import {type SchemasKeys, settings} from '../../utils/settings.js';
import type {RoundedCornersCfg} from '../../utils/types.js';

class Cfg {
    description: string;
    reset = false;

    constructor(description: string) {
        this.description = description;
    }
}

export const ResetDialog = GObject.registerClass(
    {},
    class extends Gtk.Dialog {
        /** Keys to reset  */
        private declare _reset_keys: {
            [name in SchemasKeys]?: Cfg;
        };
        /** Global rounded corners settings to reset  */
        private declare _reset_corners_cfg: {
            [name in keyof RoundedCornersCfg]?: Cfg;
        };
        /** Used to select all CheckButtons  */
        private declare _all_check_btns: Gtk.CheckButton[];

        _init(): void {
            super._init({
                useHeaderBar: 1,
                modal: true,
                title: 'Reset Preferences',
            });

            this._all_check_btns = [];

            this.set_modal(true);

            this.add_button('Apply', Gtk.ResponseType.APPLY);
            this.add_button('Cancel', Gtk.ResponseType.CANCEL);

            this.connect('response', (_source, id) => {
                if (id === Gtk.ResponseType.CANCEL) {
                    this.destroy();
                }
                if (id === Gtk.ResponseType.APPLY) {
                    this.apply();
                }
            });

            this._init_cfg();
            this._build_ui();
        }

        private _init_cfg() {
            this._reset_keys = {
                'skip-libadwaita-app': new Cfg(
                    _('Skip LibAdwaita Applications'),
                ),
                'skip-libhandy-app': new Cfg(_('Skip LibHandy Applications')),
                'focused-shadow': new Cfg(_('Focus Window Shadow Style')),
                'unfocused-shadow': new Cfg(_('Unfocus Window Shadow Style')),
                'border-width': new Cfg(_('Border Width')),
                'border-color': new Cfg(_('Border Color')),
                'debug-mode': new Cfg(_('Enable Log')),
            };

            this._reset_corners_cfg = {
                border_radius: new Cfg(_('Border Radius')),
                padding: new Cfg(_('Padding')),
                keep_rounded_corners: new Cfg(
                    _('Keep Rounded Corners when Maximized or Fullscreen'),
                ),
                smoothing: new Cfg(_('Corner Smoothing')),
            };
        }

        private _build_ui() {
            const content = this.get_content_area();
            content.orientation = Gtk.Orientation.VERTICAL;
            content.spacing = 8;

            // Title
            content.append(
                new Gtk.Label({
                    label: _('Select Items to reset'),
                    cssClasses: ['heading'],
                    halign: Gtk.Align.START,
                }),
            );

            // Select All Checkbox
            const select_all_check_btn = new Gtk.CheckButton();
            const select_all_label = new Gtk.Label({
                label: _('Select All'),
            });
            const row = new Gtk.Box();
            row.append(select_all_check_btn);
            row.append(select_all_label);
            content.append(row);

            select_all_check_btn.connect('toggled', btn => {
                for (const b of this._all_check_btns) {
                    b.active = btn.active;
                }
            });

            const build = (cfg: {[key: string]: {description: string}}) => {
                for (const key in cfg) {
                    const item = new Gtk.Box();
                    const check_btn = new Gtk.CheckButton({
                        active: false,
                        name: key,
                    });
                    check_btn.connect('toggled', source =>
                        this.on_toggled(source),
                    );
                    item.append(check_btn);
                    item.append(Gtk.Label.new(cfg[key].description));
                    content.append(item);

                    this._all_check_btns.push(check_btn);
                }
            };

            build(this._reset_corners_cfg);
            build(this._reset_keys);
        }

        private on_toggled(source: Gtk.CheckButton): void {
            const k = source.name;
            let v = this._reset_corners_cfg[k as keyof RoundedCornersCfg];
            if (v !== undefined) {
                v.reset = source.active;
                return;
            }

            v = this._reset_keys[k as SchemasKeys];
            if (v !== undefined) {
                v.reset = source.active;
                return;
            }
        }

        private apply() {
            for (const k in this._reset_keys) {
                if (this._reset_keys[k as SchemasKeys]?.reset === true) {
                    settings().g_settings.reset(k);
                    _log(`Reset ${k}`);
                }
            }

            const key: SchemasKeys = 'global-rounded-corner-settings';
            const default_cfg = settings()
                .g_settings.get_default_value(key)
                ?.recursiveUnpack() as RoundedCornersCfg;
            const current_cfg = settings().global_rounded_corner_settings;
            for (const k in this._reset_corners_cfg) {
                const _k = k as keyof RoundedCornersCfg;
                if (this._reset_corners_cfg[_k]?.reset === true) {
                    current_cfg[_k] = default_cfg[_k] as never;
                    _log(`Reset ${k}`);
                }
            }
            settings().global_rounded_corner_settings = current_cfg;

            this.destroy();
        }
    },
);
