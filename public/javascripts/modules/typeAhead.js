import axios from 'axios';
import dompurify from 'dompurify'; //strip window load events, avoid XSS attack

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}

function typeAhead(search) {
    if (!search) return ;
    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function () {
        if (!this.value) { //if there is no value, hide it
            searchResults.style.display = 'none';
            return ;
        }
        searchResults.style.display = 'block'; //display property to block if there are results
        searchResults.innerHTML = ''; //remove is there is no result

        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                if (res.data.length) {
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return ;
                }
                //when no search result found
                searchResults.innerHTML = dompurify.sanitize(`
                    <div class="search__result">
                        No results for <strong>${this.value}</strong> found!
                    </div>
                `);
            })
            .catch(error => {
                console.log(error);
            });
    });
    //handle keyboard inputs (up, down and enter)
    searchInput.on('keyup', (e) => {
        if (![38, 40, 13].includes(e.keyCode)) { //if key is not up, down or enter
            return ; //return nothing and skip it   
        }
        const current = search.querySelector('.search__result--active');
        const items = search.querySelectorAll('.search__result');
        let next;

        if (e.keyCode === 40 && current) {
            next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
            next = items[0];
        } else if (e.keyCode ===38 && current) {
            next = current.previousElementSibling || items[items.length - 1];
        } else if (e.keyCode === 38) {
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            window.location = current.href;
            return ;
        }

        if (current) {
            current.classList.remove('search__result--active');
        }
        next.classList.add('search__result--active') ;
    });
}

export default typeAhead;