import { md } from '@jam-do/jam-tools/node/md.js';

export default /*html*/`
{[importMap]}
<base href="./ref/">
<script src="./app/index.js" type="module"></script>
<link rel="stylesheet" href="./css/index.css">
<div doc>${await md('./README.md')}</div>
<test-wc></test-wc>
`;
