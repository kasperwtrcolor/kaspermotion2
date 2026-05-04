import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

console.log('GSAP Version:', gsap.version);
if (Physics2DPlugin) {
    console.log('Physics2DPlugin is available!');
} else {
    console.log('Physics2DPlugin is NOT available.');
}
