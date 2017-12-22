import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    axios
        .post(this.action) //this === html form tag (access the url)
        .then(res => {
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length; //update heart count
            if (isHearted) {
                this.heart.classList.add('heart__button--float'); //if hearted add the float class for css animation
                setTimeout(() => {
                    this.heart.classList.remove('heart__button--float');
                }, 2500);
            };
        })
        .catch(console.error);
}

export default ajaxHeart;