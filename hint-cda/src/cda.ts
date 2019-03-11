/**
 * @fileoverview Checks for cda tracking codes
 */

import { HintContext } from 'hint/dist/src/lib/hint-context';
// The list of types depends on the events you want to capture.
import { IHint, ElementFound } from 'hint/dist/src/lib/types';
import { debug as d } from 'hint/dist/src/lib/utils/debug';

import meta from './meta/cda';

const debug: debug.IDebugger = d(__filename);

const trackingDomains = ['docs.microsoft.com', 'azure.microsoft.com'];

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class CdaHint implements IHint {

    public static readonly meta = meta;

    public constructor(context: HintContext) {
        debug('yep!');
        // Your code here.
        const validateElement = async (elementFound: ElementFound) => {
            debug('starting test');

            // Code to validate the hint on the event when an element is visited.

            const { resource } = elementFound;

            const href = elementFound.element.getAttribute('href');

            if (href) {
                const url = new URL(href.toLowerCase());

                if (trackingDomains.find((domain) => url.host === domain)) {
                    if (url.searchParams.get('wt.mc_id')) {
                        debug('link fine');
                    } else {
                        await context.report(resource, `Link "${href}" is missing tracking code`);
                    }
                }
            }
        };

        context.on('element::a', validateElement);
        // As many events as you need
    }
}
