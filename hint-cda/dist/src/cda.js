"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("hint/dist/src/lib/utils/debug");
const cda_1 = require("./meta/cda");
const debug = debug_1.debug(__filename);
const trackingDomains = ['docs.microsoft.com', 'azure.microsoft.com'];
class CdaHint {
    constructor(context) {
        debug('yep!');
        const validateElement = async (elementFound) => {
            debug('starting test');
            const { resource } = elementFound;
            const href = elementFound.element.getAttribute('href');
            if (href) {
                const url = new URL(href.toLowerCase());
                if (trackingDomains.find((domain) => url.host === domain)) {
                    if (url.searchParams.get('wt.mc_id')) {
                        debug('link fine');
                    }
                    else {
                        await context.report(resource, `Link "${href}" is missing tracking code`);
                    }
                }
            }
        };
        context.on('element::a', validateElement);
    }
}
CdaHint.meta = cda_1.default;
exports.default = CdaHint;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NkYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9BLHlEQUEyRDtBQUUzRCxvQ0FBOEI7QUFFOUIsTUFBTSxLQUFLLEdBQW9CLGFBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUU3QyxNQUFNLGVBQWUsR0FBRyxDQUFDLG9CQUFvQixFQUFFLHFCQUFxQixDQUFDLENBQUM7QUFRdEUsTUFBcUIsT0FBTztJQUl4QixZQUFtQixPQUFvQjtRQUNuQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFZCxNQUFNLGVBQWUsR0FBRyxLQUFLLEVBQUUsWUFBMEIsRUFBRSxFQUFFO1lBQ3pELEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUl2QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsWUFBWSxDQUFDO1lBRWxDLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXZELElBQUksSUFBSSxFQUFFO2dCQUNOLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUV4QyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLEVBQUU7b0JBQ3ZELElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7d0JBQ2xDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztxQkFDdEI7eUJBQU07d0JBQ0gsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLElBQUksNEJBQTRCLENBQUMsQ0FBQztxQkFDN0U7aUJBQ0o7YUFDSjtRQUNMLENBQUMsQ0FBQztRQUVGLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRTlDLENBQUM7O0FBN0JzQixZQUFJLEdBQUcsYUFBSSxDQUFDO0FBRnZDLDBCQWdDQyJ9