"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generate_html_page_1 = require("hint/dist/src/lib/utils/misc/generate-html-page");
const hint_helpers_1 = require("hint/dist/src/lib/utils/hint-helpers");
const hintRunner = require("@hint/utils-tests-helpers/dist/src/hint-runner");
const hintPath = hint_helpers_1.getHintPath(__filename, true);
const tests = [
    {
        name: 'This test should pass',
        serverConfig: generate_html_page_1.default()
    },
    {
        name: `This test should fail`,
        reports: [{ message: `This should be your error message` }],
        serverConfig: generate_html_page_1.default()
    }
];
hintRunner.testHint(hintPath, tests);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdHMvY2RhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsd0ZBQStFO0FBQy9FLHVFQUFtRTtBQUVuRSw2RUFBNkU7QUFFN0UsTUFBTSxRQUFRLEdBQUcsMEJBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFRL0MsTUFBTSxLQUFLLEdBQWU7SUFDdEI7UUFDSSxJQUFJLEVBQUUsdUJBQXVCO1FBQzdCLFlBQVksRUFBRSw0QkFBZ0IsRUFBRTtLQUNuQztJQUNEO1FBQ0ksSUFBSSxFQUFFLHVCQUF1QjtRQUM3QixPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxtQ0FBbUMsRUFBRSxDQUFDO1FBQzNELFlBQVksRUFBRSw0QkFBZ0IsRUFBRTtLQUNuQztDQUNKLENBQUM7QUFFRixVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyJ9