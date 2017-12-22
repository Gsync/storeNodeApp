import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    axios
        .post(this.action) //this === html form tag (access the url)
        .then(res => {
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length; //update heart count
            console.log(isHearted);
        })
        .catch(console.error);
}

export default ajaxHeart;