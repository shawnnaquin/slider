(
    async () => {

        const applicationState = 0;

        const canvas = document
            .getElementById("canvas");

        let animationFrame = null;

        const state = [
            {
                srcImage: 'https://source.unsplash.com/random',
                margin: 10,
                isDown: false,
                x: 0,
                y: 0,
                boxes: null,
                startValues: null,
            }
        ];

        function getApplicationState() {
            return {...state[applicationState]};
        }

        function setApplicationState(newstate, ref) {

            state.unshift(newstate);
            state.pop();
            if (ref) {
                console.log(ref, state);
            }
            return getApplicationState();

        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function generateUID() {
            // I generate the UID from two parts here
            // to ensure the random number provide enough bits.
            var firstPart = (Math.random() * 46656) | 0;
            var secondPart = (Math.random() * 46656) | 0;
            firstPart = ("000" + firstPart.toString(36)).slice(-3);
            secondPart = ("000" + secondPart.toString(36)).slice(-3);
            return firstPart + secondPart;
        }

        function makebox(xpos,ypos) {

            const state = getApplicationState();

            if(!ypos)
                ypos =
                    Math.random() * (
                        window.innerHeight - (
                            state.startValues.itemWidth * 1.5
                        )
                    );

            return {
                uuid: generateUID(),
                xpos: xpos,
                ypos: ypos,
                src: getApplicationState().srcImage,
                image: new Image(),
                alpha: 1,
            };
        };

        async function preloadImage ({src,image}) {
            return new Promise(
                function(res,rej) {
                    image.src = src;
                    image.onload = res();
                    image.onerror = rej();
                }
            )
        }

        function mousedown(event) {

            const state = getApplicationState();
            state.isDown = true;
            state.x = event.clientX;
            state.y = event.clientY;
            setApplicationState(state, 'mousedown');

        }

        function mousemove(event) {

            const state = getApplicationState();

            let {isDown,boxes,startValues,x,y,margin} = state;
            let {itemWidth,rightEdge,leftEdge,qty} = startValues;

            if (
                isDown
            ) {
                x = x - event.clientX;
                y = y - event.clientY;
                // boxes = boxes.map( box => {

                //     box.xpos -= x;
                //     box.ypos -= y;

                //     return box;
                // } );
            }

            state.x = event.clientX;
            state.y = event.clientY;

            setApplicationState(state);
            // console.log(state.boxes);

        }

        function mouseup() {
            const state = getApplicationState();
            state.isDown = false;
            // console.log(state);
            setApplicationState(state, 'mouseup');
        }

        function startValues() {

            let coverOutside = 2;

            let width = window.innerWidth;

            let itemWidth = window.innerWidth < 800
                ? window.innerWidth * 0.75
                : window.innerWidth * 0.1;

            let qty = Math.floor((width / itemWidth))+coverOutside;
            let totalPixels = qty * itemWidth;
            let leftEdge = -1 * (totalPixels - width) / 2;
            let rightEdge = leftEdge + (qty*itemWidth);
            let startingpoint = (totalPixels / 2) - itemWidth;

            const state = getApplicationState();
            state.x = startingpoint;
            state.y = startingpoint;

            const startValues = {
                width,
                itemWidth,
                qty,
                totalPixels,
                leftEdge,
                rightEdge,
                startingpoint
            };

            state.startValues = startValues;

            setApplicationState(state, 'init startValues');

        }

        function generateColumn(colIndex) {

            const state = getApplicationState();
            const {itemWidth,leftEdge} = state.startValues;
            const {margin} = state;

            let xpos = (colIndex*itemWidth) + leftEdge;
            xpos += colIndex*margin;

            const b = [];

            b.push(makebox(xpos));

            for(let p=0; p < 3; p++) {
                let itemHeight = itemWidth * 1.5
                let ypos =
                    + (itemHeight * p)
                    + (margin * p)
                    + itemHeight
                    + margin;
                b.push(makebox(xpos, ypos));
            }

            return b;

        }

        async function initBoxes() {

            const state = getApplicationState();

            const {qty} = state.startValues;

            let boxes = [];

            for(let colIndex=0; colIndex<qty; colIndex++) {
                boxes.push(
                    generateColumn(colIndex)
                );
            }

            state.boxes = boxes;

            setApplicationState(state, 'init boxes');

        }

        async function render() {

            const state = getApplicationState();

            const ctx = canvas.getContext("2d");

            const p = await Promise.all(
                state.boxes.map(box => preloadImage(box))
            );

            // console.log(toDelete);
            ctx.clearRect(0,0,window.innerWidth, window.innerHeight);

            state.boxes.forEach( (box,index) => {

                ctx.globalAlpha = 1;

                if (
                    box.xpos < 0
                    || box.xpos > (window.innerWidth * 0.9)
                )
                    ctx.globalAlpha = box.alpha;

                ctx.drawImage(
                    box.image,
                    box.xpos,
                    box.ypos,
                    state.startValues.itemWidth,
                    state.startValues.itemWidth*1.5
                );

            });

            animationFrame = window.requestAnimationFrame(render);

        }

        function resize() {
            resizeCanvas();
            startValues();
            initBoxes();
        }

        function appInit() {

            resize();
            canvas.addEventListener('mousedown', mousedown);
            canvas.addEventListener('mousemove', mousemove);
            canvas.addEventListener('mouseup', mouseup);
            window.addEventListener('resize', resize);
            animationFrame = window.requestAnimationFrame(render);

        }

        function appDestroy() {
            canvas.removeEventListener('mousedown', mousedown);
            canvas.removeEventListener('mousemove', mousemove);
            canvas.removeEventListener('mouseup', mouseup);
            window.removeEventListener('resize', resize);
            window.cancelAnimationFrame(animationFrame);
        }

        appInit();

    }
)();
