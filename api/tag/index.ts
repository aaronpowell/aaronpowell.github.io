import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loadPosts } from "../postLoader";

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const tags = req.params.tag.split(",");

    const posts = await loadPosts();

    const postsByTag = posts.filter((p) =>
        tags.every((tag) => p.tags.includes(tag))
    );

    if (!postsByTag.length) {
        context.res = {
            status: 404,
        };
    } else {
        context.res = {
            body: postsByTag,
        };
    }
};

export default httpTrigger;
