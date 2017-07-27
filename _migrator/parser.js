const fs = require('fs');
const path = require('path');
const cson = require('cson');
const json2yaml = require('json2yaml');

const postsPath = path.join(__dirname, '..', 'src', 'documents', 'posts');

fs.readdir(postsPath, (err, paths) => {
    paths.forEach((filename) => {
        let post = fs.readFileSync(path.join(postsPath, filename), 'utf8').split('\r\n').map(s => s.split('\n')).reduce((arr, x) => arr.concat(x), []);
        
        let header = [];
        let body = [];
        
        let inHeader = false;
        for (let i = 0; i < post.length; i++) {
            let line = post[i];
        
            if (line === '--- cson') {
                inHeader = true;
                continue;
            } else if (line === '---') {
                inHeader = false;
                continue;
            }
        
            if (inHeader) {
                header.push(line);
            } else {
                body.push(line);
            }
        }
        
        const headerObject = cson.parse(header.join('\r\n'));
        
        const newPost =
            json2yaml.stringify(headerObject).split('\n').join('\r\n') +
            '---\r\n' +
            body.join('\r\n');

        fs.writeFileSync(path.join(__dirname, '_posts', filename.replace('.html.', '.')), newPost, 'utf8');
        
    });
});