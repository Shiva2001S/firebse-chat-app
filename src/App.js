import { Container, Box, VStack, Button, HStack, Input } from "@chakra-ui/react";
import Message from "./Components/Message";
import {onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut} from "firebase/auth";
import { app } from "./firebase";
import { useEffect, useRef, useState } from "react";
import {getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider);
}

const logoutHandler = () => signOut(auth);

function App() {
  const q = query(collection(db, "Message"), orderBy("createdAt", "asc"));
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();
  
    try {
      console.log(user);
      setMessage("");
      await addDoc(collection(db, "Message"), {
        text : message,
        uid : user.uid,
        uri : user.photoURL, 
        createdAt : serverTimestamp(),
      })

      divForScroll.current.scrollIntoView({behaviour : "smooth"});
    } catch (error) {
      alert(error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    }, []);

    const unsubscribeForMessage = onSnapshot(q, async (snap) => {
      console.log("Snapshot received:", await snap.docs);
      setMessages(
        await snap.docs.map((item) => {
          const id = item.id;
  
          return {id, ...item.data()};
        })
      )
    })

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    }
  });

  return (
    <Box bg={"red.50"}>
      {user?(
        <Container  bg={"white"}>
      <VStack  padding={"4"}>
        <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
          Logout
        </Button>
      </VStack>
      <VStack h={"full"} w={"full"} overflow={"auto"} css={{"&::-webkit-scrollbar":{
        display: "none"
      }}} >
        {
          messages.map(item => (
            <Message key={item.id} user={item.uid === user.uid ? "me" : "other"} text={item.text} uri={item.uri} />
          ))
        }
      <div ref={divForScroll}></div>
      </VStack>


      <form  onSubmit={submitHandler} style={{ width : "100%"}}>
        <HStack>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter a message" />
          <Button colorScheme="purple" type="submit">
            Send
          </Button>
        </HStack>
      </form>
      </Container>
      ) : (
        <VStack bg={'white'} h={'100vh'} justifyContent={'center'}>
          <Button colorScheme="purple" onClick={loginHandler}>Sign In with Google</Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
