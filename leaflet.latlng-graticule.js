L.LatlngGraticule = L.Layer.extend({
  options: {
    showLabel: false,
    showLine: true,
    showTick: false,
    tickLength: 8,
    opacity: 0.8,
    weight: 0.8,
    color: '#444',
    font: '12px Verdana',
    zoomInterval: [
      { start: 2, end: 3, interval: 30 },
      { start: 4, end: 4, interval: 10 },
      { start: 5, end: 7, interval: 5 },
      { start: 8, end: 10, interval: 1 },
      { start: 11, end: 12, interval: 0.5 },
      { start: 13, end: 20, interval: 0.2 }
    ],
    lngLabelPosition: 'bottom',
    latLabelPosition: 'right',
    labelFormatter: function (latlng, type) {
      const deg = Math.floor(Math.abs(type === 'lng' ? latlng.lng : latlng.lat));
      const min = Math.round((Math.abs(type === 'lng' ? latlng.lng : latlng.lat) - deg) * 60);
      const dir = type === 'lng'
        ? (latlng.lng >= 0 ? 'E' : 'W')
        : (latlng.lat >= 0 ? 'N' : 'S');
      return `${deg}°${min.toString().padStart(2, '0')}′${dir}`;
    }
  },

  onAdd: function (map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
    this._ctx = this._canvas.getContext('2d');
    this._frame = null;
    this._map.getPanes().overlayPane.appendChild(this._canvas);
    map.on('viewreset zoomend moveend resize', this._reset, this);
    this._reset();
  },

  onRemove: function (map) {
    map.getPanes().overlayPane.removeChild(this._canvas);
    map.off('viewreset zoomend moveend resize', this._reset, this);
  },

  _reset: function () {
    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    const bounds = this._map.getBounds();
    const zoom = this._map.getZoom();
    const interval = this._getInterval(zoom);

    const ctx = this._ctx;
    ctx.clearRect(0, 0, size.x, size.y);
    ctx.globalAlpha = this.options.opacity;
    ctx.strokeStyle = this.options.color;
    ctx.lineWidth = this.options.weight;
    ctx.font = this.options.font;
    ctx.fillStyle = this.options.color;

    const top = bounds.getNorth();
    const bottom = bounds.getSouth();
    const left = bounds.getWest();
    const right = bounds.getEast();

    const latLines = [];
    for (let lat = Math.ceil(bottom / interval) * interval; lat < top; lat += interval) {
      latLines.push(lat);
    }

    const lngLines = [];
    for (let lng = Math.ceil(left / interval) * interval; lng < right; lng += interval) {
      lngLines.push(lng);
    }

    latLines.forEach(lat => {
      const y = this._map.latLngToContainerPoint([lat, left]).y;
      if (this.options.showLine) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.x, y);
        ctx.stroke();
      }
      if (this.options.showTick) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.options.tickLength, y);
        ctx.stroke();
      }
      if (this.options.showLabel && this.options.latLabelPosition === 'right') {
        const text = this.options.labelFormatter(L.latLng(lat, left), 'lat');
        ctx.fillText(text, size.x - 50, y + 4);
      }
    });

    lngLines.forEach(lng => {
      const x = this._map.latLngToContainerPoint([top, lng]).x;
      if (this.options.showLine) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.y);
        ctx.stroke();
      }
      if (this.options.showTick) {
        ctx.beginPath();
        ctx.moveTo(x, size.y - this.options.tickLength);
        ctx.lineTo(x, size.y);
        ctx.stroke();
      }
      if (this.options.showLabel && this.options.lngLabelPosition === 'bottom') {
        const text = this.options.labelFormatter(L.latLng(top, lng), 'lng');
        ctx.fillText(text, x + 4, size.y - 4);
      }
    });
  },

  _getInterval: function (zoom) {
    for (let i = 0; i < this.options.zoomInterval.length; i++) {
      const zi = this.options.zoomInterval[i];
      if (zoom >= zi.start && zoom <= zi.end) return zi.interval;
    }
    return 30;
  }
});

L.latlngGraticule = function (options) {
  return new L.LatlngGraticule(options);
};
