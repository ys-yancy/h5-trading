class LoadingDesc{
    constructor() {

        var loadEl = $('.ui.loading')
        
        var p = document.createElement('P');
        var textNode = document.createTextNode('desc');

        p.style.cssText = 'width:9rem;margin-left:-3.22rem;margin-bottom:24px'
        p.appendChild(textNode);

        loadEl.prepend(p);
    }
}

module.exports = LoadingDesc;