import React, { useRef, useState, useEffect, useCallback } from "react";
// import Head from "next/head";
// import styles from "../styles/Home.module.scss";
import "../../App.css";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as bodyPix from "@tensorflow-models/body-pix";
import Webcam from "react-webcam";

import dgswback from "../../assets/dgswback.jpg";
import main from "../../assets/main.jpg";
import school from "../../assets/school.jpg";
// import cut from "../../assets/cut1.jpg";
import cut from "../../assets/cut.png";

function App() {
  // ---

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isFin, setisFin] = useState(false);

  const [image, setImage] = useState([]);

  // -------- 

  const [bodypixnet, setBodypixnet] = useState();
  const [prevClassName, setPrevClassName] = useState();

  const [backImg, setBackImg] = useState(new Image());
  const [isload, setIsload] = useState(false);
  const [url, setUrl] = useState(school);
  useEffect(() => {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      setBackImg(image);
      setIsload(true);
    };
  }, [url]);

  const drawimage = async (webcam, context, canvas) => {
    // create tempCanvas
    const sexCanvas = document.createElement("canvas");
    sexCanvas.width = canvas.width;
    sexCanvas.height = canvas.height;
    const sexCtx = sexCanvas.getContext("2d");

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = webcam.videoWidth;
    tempCanvas.height = webcam.videoHeight;
    const tempCtx = tempCanvas.getContext("2d");

    const segmentation = await bodypixnet.segmentPerson(webcam);
    const mask = bodyPix.toMask(segmentation);

    (async function drawMask() {
      requestAnimationFrame(drawMask);
      // draw mask on tempCanvas
      const segmentation = await bodypixnet.segmentPerson(webcam);
      const mask = bodyPix.toMask(segmentation);
      tempCtx.putImageData(mask, 0, 0);
      
      // draw original image
      sexCtx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
      // use destination-out, then only masked area will be removed
      sexCtx.save();
      sexCtx.globalCompositeOperation = "destination-out";
      sexCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      sexCtx.restore();

      context.clearRect(0, 0, canvas.width, canvas.height);
      if (isload) {
        context.drawImage(backImg, 0, 0, canvas.width, canvas.height);
      }
      context.drawImage(sexCanvas, 0, 0, canvas.width, canvas.height);
    })();
  };

  const clickHandler = async (className) => {
    // setIsload(false);
    const webcam = webcamRef.current.video;
    const canvas = canvasRef.current;
    webcam.width = canvas.width = webcam.videoWidth;
    webcam.height = canvas.height = webcam.videoHeight;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    setUrl(className)

    if (bodypixnet) {
      drawimage(webcam, context, canvas);
    }

  };

  // --------

  function snapshot() {
    console.log(
      "canvasRef.current.toDataURL",
      canvasRef.current.toDataURL("image/jpeg")
    );

    setImage((prev) => [...prev, canvasRef.current.toDataURL("image/jpeg")]);
  }

  useEffect(() => {
    console.log(image);
    if (image.length === 2) {
      setisFin(true);

    }
  }, [image]);

  useEffect(() => {
    bodyPix.load().then((net) => {
      setBodypixnet(net);
    });
  }, []);

  return (
    <>
      {!isFin ? (
        <div className="App">
          <Webcam
            ref={webcamRef}
            audio={false}
            // height={0}
            // width={0}
            width={1280}
            height={720}
            screenshotFormat="image/jpeg"
            // videoConstraints={videoConstraints}
            className="webcam"
          />
          <canvas ref={canvasRef} className="canvas" />
          <div className="buttons">
            <button onClick={() => clickHandler(dgswback)}>학교 운동장</button>
            <button onClick={() => clickHandler(school)}>학교 본관 정문</button>
            <button onClick={() => clickHandler(main)}>학교 크로마키</button>
            <button onClick={() => snapshot()}>
              <h2>사진 촬영</h2>
            </button>
          </div>
          {/* {image.map((e, idx) => (
          <img src={e} key={idx} width="200px" height="200px" />
        ))} */}
        </div>
      ) : (
        <div className="absolute">
          <div className="cut">
            {image.map((e, idx) => (
              <img src={e} key={idx} />
            ))}
          </div>
          <img className="img-frame" src={cut} alt="" />
        </div>
      )}
    </>
  );
}

export default App;
