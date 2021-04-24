import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import firebase from 'firebase';
import { Loading } from './LoadingComponent';
import { TextInput } from 'react-native';
import { Button } from 'react-native';
import CheckBox from '@react-native-community/checkbox';


export default function questionDisp(props) {
    const db = firebase.firestore();
    const ques= props.route.params.ques;
    const mainUser= props.route.params.user;
    const navigate = props.navigation.navigate;
    let [answers, updateAns] = React.useState(null);
    let [newAnswer, updateNewAns] = React.useState(null);
    let [fetched, updateFetch] = React.useState(false);
    let [sub, updateSub] = React.useState(false);
    let [tick, updateTick] = React.useState({});

    const Answers = (props) => {
        const fetchAnswers = async () => { // This function will fetch all the answers of the selected question and place the correct answer at top of all other answers
            updateFetch(false); // The loader would be shown whenever (fetch = fasle)
            //loader would show that property is getting fetched
            var user= {
                initialInfo: 'initial property'
            };
            var main= [];
            await db.collection('answers').where('qid', '==', props.ques.qid).get().then(async (snapshot)=> { // fetching answers according to question id
                main = snapshot.docs[0]?await Promise.all(snapshot.docs[0].data().username_and_answers.map(async (data)=> {
                    // information regarding user and their respected answer is fetched and stored here
                    await db.collection('users').where('phno', '==', data.mobile).get().then((snapshot)=> {
                        user= {
                            dob: snapshot.docs[0].data().dob,
                            email: snapshot.docs[0].data().email,
                            name: snapshot.docs[0].data().name,
                            mobile: snapshot.docs[0].data().phno,
                            photo: snapshot.docs[0].data().photo,
                            gender: snapshot.docs[0].data().gender,
                            lol: snapshot.docs[0].data().lol
                        }
                    })
                    .catch(err=> {
                        console.log(err)
                    })
                    main = {
                        userInfo: user,
                        answer: data.answer,
                        selected: data.selected,
                        created: data.created
                    }
                    return main;
                })):null;
            })
            .then(async ()=> {
                if(main) {
                    for(var i=0; i<main.length; i++) {
                        if(main[i].selected) {
                            // if the answer is selected as correct then place it on the top of array
                            // so that while displaying all answers later the correct answer is shown first.
                            var temp2 = {};
                            temp2[main[i].created] = true;
                            updateTick(temp2);

                            var temp = main[0];
                            main[0] = {
                                userInfo: user,
                                answer: main[i].answer,
                                selected: main[i].selected,
                                created: main[i].created
                            };
                            main[i]= temp;
                        }
                    }
                }
            })
            .then(()=> {
                    updateAns(main);
                    updateFetch(true);
                }
            )
            .catch((err)=> {
                console.log(err);
            })
        }

        React.useEffect(() => {
            if(!answers && !fetched) {
                fetchAnswers();
            }
        }, []); //replecating componentDidMount Behaviour
        const handlePress = () => {
            console.log('I am called')  
        }

        const selectCheckbox = async (item) => {
            if(!sub) {
                updateSub(true);
                var temp = {};
                temp[item.created] = !item.selected;
                updateTick(temp);

                var details = await answers.map((item2)=> {
                    if(item2.created == item.created) {
                        return(
                            {
                                answer: item2.answer,
                                created: item2.created,
                                mobile: item2.userInfo.mobile,
                                selected: !item2.selected
                            }
                        )
                    }
                    else {
                        return(
                            {
                                answer: item2.answer,
                                created: item2.created,
                                mobile: item2.userInfo.mobile,
                                selected: false
                            }
                        )
                    }
                });

                details = {
                    qid: ques.qid,
                    username_and_answers: details
                }

                await db.collection('answers').doc(ques.qid).set(details)
                .then(()=> {
                    updateSub(false);
                })
                .catch((err)=> {
                    console.log(err);
                });
                

                updateAns(null);
                updateFetch(false);
                fetchAnswers();
                
            }
        }

        if(answers) {
            return (
                <ScrollView>
                    {
                        answers.map(item=> (
                            <View
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#fff',
                                    paddingTop: 10,
                                    paddingLeft: 20,
                                    paddingRight: 10,
                                    paddingBottom: 10
                                }}
                            >
                                {mainUser.phno == ques.user.mobile?<CheckBox 
                                    value= {tick[item.created]}
                                    onValueChange= {()=>{
                                        selectCheckbox(item)
                                    }}
                                    tintColors = {{
                                        true: '#007aff'
                                    }}
                                />:item.selected?<CheckBox 
                                    value= {tick[item.created]}
                                    disabled = {true}
                                    tintColors = {{
                                        true: '#007aff'
                                    }}
                                />:null}
                                <TouchableOpacity
                                    onPress={()=> {
                                        var info = item.userInfo;
                                        navigate('userDisp', info);
                                    }}
                                >
                                    <Image 
                                            source={
                                                item.userInfo.photo?
                                                {uri: item.userInfo.photo}:
                                                require('./images/user.png')
                                            }
                                            style={{
                                                height: 50,
                                                width: 50
                                            }} 
                                        />
                                    <Text
                                        style={{
                                            color: '#999',
                                            marginTop: -30,
                                            marginLeft: 60
                                        }}
                                    >
                                        Submited By: - {item.userInfo.name}
                                    </Text>
                                </TouchableOpacity>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        marginTop: 20,
                                        color: '#555'
                                    }}
                                    onPress={handlePress}
                                >
                                    {item.answer}
                                </Text>
                            </View>
                        ))
                    }
                </ScrollView>
            )
        }
        else if(fetched){
            return (
                <Text
                        style={{
                            fontSize: 16,
                            color: '#229'
                        }}
                    >
                        No Answers Yet !!!!
                </Text>
            )
        }
        else {
            return(
                <Loading />
            )
        }

    }



    const subAns = async () => {
        if(!sub && fetched && newAnswer != null && newAnswer != '') {
            updateSub(true);
            var temp = answers;
            var answered = null;
            var id = null;
            if(temp) {
                temp = await temp.map((item)=> {
                    return(
                        {
                            answer: item.answer,
                            created: item.created,
                            mobile: item.userInfo.mobile,
                            selected: item.selected
                        }
                    )
                });
                temp.push({
                        answer: newAnswer,
                        selected: false,
                        mobile: mainUser.phno,
                        created: temp.length
                    }
                )
                temp = {
                    qid: ques.qid,
                    username_and_answers: temp
                }
            }
            else {
                temp = {
                    qid: ques.qid,
                    username_and_answers: [{
                        answer: newAnswer,
                        selected: false,
                        mobile: mainUser.phno,
                        created: 0
                    }]
                }
            }
            await db.collection('answers').doc(ques.qid).set(temp, {merge: true})
            .then (async () => {
                    await db.collection('users').where('phno', '==', mainUser.phno).get().then((snapshot)=> {
                            answered= snapshot.docs[0].data().answered;
                            id= snapshot.docs[0].id;
                        })
                        .then(async ()=> {
                            if(answered && !answered.includes(ques.qid)) {
                                answered.push(ques.qid)
                                await db.collection('users').doc(id).set({answered: answered}, {merge: true})
                            }
                            else if(!answered) {
                                answered = [ques.qid]
                                await db.collection('users').doc(id).set({answered: answered}, {merge: true})
                                .catch((err)=> {
                                    console.log(err);
                                })
                            }
                        })
                        .catch((err)=> {
                            console.log(err);
                        })
                }
            )
            .catch((err)=> {
                console.log(err)
            })
            updateAns(null);
            updateFetch(false);
            fetchAnswers();
            updateSub(false);
        }
    }



    return (
        <View>
            <View
                style={{
                    marginTop: 20,
                    backgroundColor: '#fff',
                    paddingBottom: 10,
                    paddingTop: 20,
                    paddingLeft: 20,
                    paddingRight: 20
                }}
            >
                <TouchableOpacity
                    onPress={()=> {
                                var info = ques.user;
                                navigate('userDisp', info);
                            }}
                >
                    <Image 
                            source={
                                ques.user.photo?
                                {uri: ques.user.photo}:
                                require('./images/user.png')
                            }
                            style={{
                                height: 50,
                                width: 50
                            }} 
                        />
                    <Text
                        style={{
                            color: '#999',
                            marginTop: -30,
                            marginLeft: 60
                        }}
                    >
                        Submited By: - {ques.user.name}
                    </Text>
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: 20,
                        marginTop: 30
                    }}
                >
                    {ques.question}
                </Text>
            </View>
            <ScrollView
                style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingBottom: 50,
                    height: '63%'
                }}
            >
                <Answers ques={ques} />
            </ScrollView>
            <View 
                style={{
                    width: '100%',
                }}
            >
                <TextInput 
                    style= {{
                        backgroundColor: '#fff',
                        height: 50,
                        borderWidth: 1,
                        paddingLeft: 10,
                        paddingRight: 10
                    }}
                    variant='outlined' 
                    placeholder= "Enter your Answer here..."
                    value={newAnswer}
                    onChangeText={(text)=> {updateNewAns(text)}}
                />
                
                <Button onPress= {subAns} title="Submit Answer" />
                
            </View>
        </View>
    );
}