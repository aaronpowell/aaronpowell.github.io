import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loadPosts } from "../postLoader";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    const tag = req.params.tag;

    const posts = await loadPosts();

    const postsByTag = posts.filter(p => p.tags.some(t => t === tag));

    if (!postsByTag.length) {
        context.res = {
            status: 404
        };
    } else {
        context.res = {
            body: postsByTag
        };
    }
};

export default httpTrigger;
