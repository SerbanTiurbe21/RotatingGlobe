varying vec3 vertexNormal;

void main(){
    float intensitate = pow(0.5 - dot(vertexNormal,vec3(0,0,1.0)),2.0);
    gl_FragColor = vec4(0.3,0.6,1.0,1.0) * intensitate;
}