const OPTS = {
    offset: function(fduration){return 0.3*fduration},
    playbackCoef: 1.25
}

export class Framer {
    constructor(video, frameRate, opts=OPTS) {
        this.video = video;
        ///////////////////////////////////////////////////////////////////////
        // FRAME VARIABLES
        //
        // framerate
        // As of writing this, I know of no good way to determine framerate in
        // javascript. Thus is needs to be supplied.
        //
        //
        ///////////////////////////////////////////////////////////////////////
        this.FRAMERATE = frameRate;
        this.FRAME_DURATION = 1/this.FRAMERATE;
        this.playbackFactor = 0;

        this.opts = OPTS;
        if (this.opts !== undefined && opts.offset !== undefined) {
            this.offset = this.opts.offset(this.FRAME_DURATION);
        } else {
            this.offset = OPTS.offset(this.FRAME_DURATION);
        }
        if (this.opts !== undefined && opts.playbackCoef !== undefined) {
            this.playbackCoef = this.opts.playbackCoef;
        } else {
            this.playbackCoef = OPTS.playbackCoef;
        }

        ///////////////////////////////////////////////////////////////////////
        // Set up listeners
        ///////////////////////////////////////////////////////////////////////
        this.events = {
            "frameupdate": [],
            "playbackSpeedChange": []
        }
        this._lastFrame = null; // for fewer extraneous frameupdate events
        this._setupVideoEvents();
    }

    ////////////////////////////////////////////////////////////////////////////
    // main functions
    ////////////////////////////////////////////////////////////////////////////
    getTime() {
        return this.video.currentTime;
    }

    setFrame(frame, force=false) {
        if (force || frame != this.getFrame())
            this.video.currentTime = this.FRAME_DURATION * frame + this.offset;
        return {frame: frame, time: this.getTime()}
    }

    getFrame() {
        return Math.floor(this.video.currentTime / this.FRAME_DURATION);
    }

    stepForward(n=1) {
        this.frameupdate(this.setFrame(this.getFrame() + n));
    }

    stepBackward(n=1) {
        this.frameupdate(this.setFrame(this.getFrame() - n));
    }
    
    setPlayback(rate) {
        this.video.playbackRate = rate;
    }

    speedUp() {
        this.playbackFactor = this.playbackFactor + 1;
        this.setPlayback(this.playbackCoef ** this.playbackFactor);
    }

    slowDown() {
        this.playbackFactor = this.playbackFactor - 1;
        this.setPlayback(this.playbackCoef ** this.playbackFactor);
    }

    ////////////////////////////////////////////////////////////////////////////
    // Modify Video Events
    ////////////////////////////////////////////////////////////////////////////
    _setupVideoEvents() {
        this.video.addEventListener("play", () => {this._onplay()});
        this.video.addEventListener("pause", () => {this._onpause()});
        this.video.addEventListener("seeked", () => {this._onseeked()});
        this.video.addEventListener("mouseup", () => {this._onmouseup()});
        this.video.addEventListener("timeupdate", () => {
            this.frameupdate({frame: this.getFrame(), time: this.getTime()});
        });
        this.video.addEventListener("ratechange", () => {
            this.playbackSpeedChange({speed: this.video.playbackRate});
        });
    }

    _onplay() {
        this._watchForFrameUpdate();
    }

    _onpause() {
        this.frameupdate(this.setFrame(this.getFrame(), true));
    }

    _onmouseup() {
        this.frameupdate(this.setFrame(this.getFrame(), true));
    }

    _onseeked() {
        this.frameupdate(this.setFrame(this.getFrame()));
    }

    _watchForFrameUpdate() {
        const frame = this.getFrame();
        if (frame != this._lastFrame) {
            this._lastFrame = frame;
            this.frameupdate({frame: frame, time: this.getTime()});
        }
        if (!this.video.paused)
            requestAnimationFrame(() => this._watchForFrameUpdate())
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    ////////////////////////////////////////////////////////////////////////////
    frameupdate(event) {
        this.events["frameupdate"].forEach(f => f(event));
    }

    playbackSpeedChange(event) {
        this.events["playbackSpeedChange"].forEach(f => f(event));
    }

    ////////////////////////////////////////////////////////////////////////////
    // Listeners
    ////////////////////////////////////////////////////////////////////////////

    addEventListener(name, handler) {
        this.events[name].push(handler);
    }

    removeEventListener(name, handler) {
        if (!this.events.hasOwnProperty(name)) return;
        const index = this.events[name].indexOf(handler);
        if (index != -1)
            this.events[name].splice(index, 1);
    }
}

