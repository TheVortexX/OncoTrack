import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

console.log('width', width, 'height', height);
const scale = width / 430;

export const normaliseSize = (size: number) => {
    return Math.round(size * scale);
};

export const inverseNormaliseSize = (size: number) => {
    return Math.round(size / scale);
}